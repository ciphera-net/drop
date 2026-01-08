/**
 * Chunked Upload API
 */

import axios from 'axios'
import type { UploadResponse } from '../types/api'
import { arrayBufferToBase64, encryptChunk, encryptString } from '../crypto/encryption'
import { importEncryptionKey, encodeKeyForSharing } from '../crypto/key-management'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// 50MB chunks
export const CHUNK_SIZE = 50 * 1024 * 1024 
const MAX_CONCURRENT_UPLOADS = 5 // * Increased from 3 to 5 to maximize bandwidth

// * Simple P-Limit implementation to manage concurrency queues
const pLimit = (concurrency: number) => {
  const queue: (() => void)[] = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      queue.shift()!();
    }
  };

  return async <T>(fn: () => Promise<T>): Promise<T> => {
    if (activeCount >= concurrency) {
      await new Promise<void>(resolve => queue.push(resolve));
    }
    activeCount++;
    try {
      return await fn();
    } finally {
      next();
    }
  };
};

interface InitUploadResponse {
  uploadId: string
  key: string // internal ID
}

interface UploadPartResponse {
  etag: string
  partNumber: number
}

interface FileMetadata {
  file: File
  expirationMinutes?: number
  password?: string
  downloadLimit?: number
  oneTimeDownload?: boolean
  captcha_id?: string
  captcha_solution?: string
  captcha_token?: string
}

export async function uploadFileChunked(
  file: File,
  encryptionKeyRaw: Uint8Array | null,
  metadata: FileMetadata,
  onProgress?: (progress: number, loaded: number, total: number) => void
): Promise<UploadResponse> {
  // * 1. Prepare Key
  let keyPair: { key: CryptoKey; raw: Uint8Array }
  
  // Import helpers
  const { generateEncryptionKey, generateIV } = await import('../crypto/key-management')

  if (encryptionKeyRaw) {
    keyPair = {
      key: await importEncryptionKey(encryptionKeyRaw),
      raw: encryptionKeyRaw
    }
  } else {
    keyPair = await generateEncryptionKey()
  }

  // * 2. Encrypt Metadata (Filename)
  const metadataIV = generateIV()
  const encryptedFilenameBuffer = await encryptString(file.name, keyPair.key, metadataIV)
  const encryptedFilename = arrayBufferToBase64(encryptedFilenameBuffer)
  const ivBase64 = arrayBufferToBase64(metadataIV)

  // * 3. Init Upload
  const initBody = {
    encryptedFilename,
    iv: ivBase64,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream', // Default if empty
    expirationMinutes: metadata.expirationMinutes,
    password: metadata.password,
    downloadLimit: metadata.downloadLimit,
    oneTimeDownload: metadata.oneTimeDownload,
    chunkSize: CHUNK_SIZE,
    captcha_id: metadata.captcha_id,
    captcha_solution: metadata.captcha_solution,
    captcha_token: metadata.captcha_token,
  }

  const initRes = await axios.post<{
    uploadToken: string
    uploadId: string
    shareId: string
  }>(`${API_URL}/api/v1/upload/init`, initBody)
  
  const { uploadToken, uploadId, shareId } = initRes.data

  // * 4. Pipelined Chunk Upload
  // We separate "Preparation" (Read+Encrypt) from "Upload" (Network)
  // This allows us to prepare the next chunk while the previous one is uploading.
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
  const chunkProgress = new Array(totalChunks).fill(0)
  
  const updateGlobalProgress = (chunkIndex: number, loaded: number) => {
    if (!onProgress) return
    chunkProgress[chunkIndex] = loaded
    const totalLoaded = chunkProgress.reduce((a, b) => a + b, 0)
    const percent = Math.min((totalLoaded / file.size) * 100, 100)
    onProgress(percent, totalLoaded, file.size)
  }

  // Limiters
  const uploadLimit = pLimit(MAX_CONCURRENT_UPLOADS);
  const prepareLimit = pLimit(MAX_CONCURRENT_UPLOADS + 1); // Allow 1 chunk to be pre-prepared

  const tasks: Promise<{ etag: string; partNumber: number }>[] = [];

  for (let i = 0; i < totalChunks; i++) {
    // Schedule the entire pipeline for this chunk
    const task = prepareLimit(async () => {
      // 1. Prepare (Read & Encrypt)
      // This runs as soon as there is space in memory (controlled by prepareLimit)
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunkBlob = file.slice(start, end)
      
      const chunkArrayBuffer = await chunkBlob.arrayBuffer()
      const encryptedChunk = await encryptChunk(chunkArrayBuffer, keyPair.key)
      const encryptedBlob = new Blob([encryptedChunk], { type: 'application/octet-stream' })
      
      // 2. Upload
      // This waits until there is a network slot (controlled by uploadLimit)
      return uploadLimit(async () => {
        const partNumber = i + 1
        const formData = new FormData()
        formData.append('uploadToken', uploadToken)
        formData.append('partNumber', partNumber.toString())
        formData.append('file', encryptedBlob)

        const chunkRes = await axios.post<UploadPartResponse>(`${API_URL}/api/v1/upload/part`, formData, {
          onUploadProgress: (e) => {
            if (e.total) {
              const progressRatio = e.loaded / e.total
              const actualBytesLoaded = progressRatio * chunkBlob.size
              updateGlobalProgress(i, actualBytesLoaded)
            }
          }
        })
        
        // Ensure 100% for this chunk is recorded
        updateGlobalProgress(i, chunkBlob.size)

        return {
          etag: chunkRes.data.etag,
          partNumber: chunkRes.data.partNumber
        }
      })
    })

    tasks.push(task)
  }

  // Wait for all
  const results = await Promise.all(tasks)
  
  // Sort parts to ensure correct order
  results.sort((a, b) => a.partNumber - b.partNumber)

  // * 5. Complete Upload
  const completeBody = {
    uploadToken,
    parts: results
  }
  
  const completeRes = await axios.post(`${API_URL}/api/v1/upload/complete`, completeBody)
  const responseData = completeRes.data
  
  // * 6. Generate Response
  const encodedKey = encodeKeyForSharing(keyPair.raw)
  const shareUrl = `${window.location.origin}/${shareId}#${encodedKey}`

  return {
    shareId: shareId,
    shareUrl,
    expiresAt: responseData.expiresAt
  }
}
