/**
 * Chunked Upload API
 */

import axios from 'axios'
import type { UploadResponse } from '../types/api'
import { arrayBufferToBase64, encryptChunk, encryptString } from '../crypto/encryption'
import { importEncryptionKey, encodeKeyForSharing } from '../crypto/key-management'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// 64MB chunks
export const CHUNK_SIZE = 64 * 1024 * 1024 

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

  // * 4. Loop Chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
  const parts: { etag: string; partNumber: number }[] = []
  
  let uploadedBytes = 0
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunkBlob = file.slice(start, end)
    
    // Read & Encrypt
    const chunkArrayBuffer = await chunkBlob.arrayBuffer()
    const encryptedChunk = await encryptChunk(chunkArrayBuffer, keyPair.key)
    
    // Upload Part
    const partNumber = i + 1
    
    const formData = new FormData()
    formData.append('uploadToken', uploadToken)
    formData.append('partNumber', partNumber.toString())
    // Create a Blob from the encrypted chunk
    const encryptedBlob = new Blob([encryptedChunk], { type: 'application/octet-stream' })
    formData.append('file', encryptedBlob)

    const chunkRes = await axios.post<UploadPartResponse>(`${API_URL}/api/v1/upload/part`, formData, {
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          const chunkProgress = (e.loaded / e.total) * chunkBlob.size
          const currentTotal = uploadedBytes + chunkProgress
          const percent = (currentTotal / file.size) * 100
          onProgress(percent, currentTotal, file.size)
        }
      }
    })
    
    parts.push({
      etag: chunkRes.data.etag,
      partNumber: chunkRes.data.partNumber
    })
    
    uploadedBytes += chunkBlob.size
    
    if (onProgress) {
      const percent = (uploadedBytes / file.size) * 100
      onProgress(percent, uploadedBytes, file.size)
    }
  }

  // * 5. Complete Upload
  const completeBody = {
    uploadToken,
    parts
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
