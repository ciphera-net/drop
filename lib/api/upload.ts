/**
 * Upload API calls
 */

import axios from 'axios'
import type { UploadRequest, UploadResponse } from '../types/api'
import { arrayBufferToBase64, encryptChunk } from '../crypto/encryption'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

/**
 * Upload an encrypted file
 */
export async function uploadFile(
  request: UploadRequest,
  onProgress?: (progress: number, loaded: number, total: number) => void
): Promise<UploadResponse> {
  const formData = new FormData()

  // * Create a Blob from the encrypted ArrayBuffer
  // This is efficient and doesn't require Base64 conversion
  if (request.encryptedData) {
    const blob = new Blob([request.encryptedData], { type: 'application/octet-stream' })
    formData.append('file', blob)
  } else {
    throw new Error('Encrypted data missing for standard upload')
  }

  // * Append metadata
  formData.append('encryptedFilename', request.encryptedFilename)
  formData.append('iv', arrayBufferToBase64(request.iv))
  formData.append('fileSize', request.file.size.toString())
  formData.append('mimeType', request.file.type)
  if (request.expirationMinutes) formData.append('expirationMinutes', request.expirationMinutes.toString())
  if (request.password) formData.append('password', request.password)
  if (request.downloadLimit) formData.append('downloadLimit', request.downloadLimit.toString())
  if (request.oneTimeDownload) formData.append('oneTimeDownload', 'true')

  // * Captcha
  if (request.captcha_id) formData.append('captcha_id', request.captcha_id)
  if (request.captcha_solution) formData.append('captcha_solution', request.captcha_solution)
  if (request.captcha_token) formData.append('captcha_token', request.captcha_token)

  try {
    const response = await axios.post(`${API_URL}/api/v1/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = (progressEvent.loaded * 100) / progressEvent.total
          onProgress(percentCompleted, progressEvent.loaded, progressEvent.total)
        }
      }
    })
    return response.data
  } catch (error: any) {
    const errorMessage = error.response?.data?.details 
      ? `${error.response.data.error}: ${error.response.data.details}` 
      : (error.response?.data?.message || error.message || 'Request failed')
    throw new Error(errorMessage)
  }
}

/**
 * Upload an encrypted file to a specific request
 */
export async function uploadToRequest(
  requestId: string,
  request: UploadRequest,
  onProgress?: (progress: number, loaded: number, total: number) => void
): Promise<UploadResponse> {
  const formData = new FormData()

  // * Create a Blob from the encrypted ArrayBuffer
  if (request.encryptedData) {
    const blob = new Blob([request.encryptedData], { type: 'application/octet-stream' })
    formData.append('file', blob)
  } else {
    throw new Error('Encrypted data missing for request upload')
  }

  // * Append metadata
  formData.append('encryptedFilename', request.encryptedFilename)
  formData.append('iv', arrayBufferToBase64(request.iv))
  formData.append('fileSize', request.file.size.toString())
  formData.append('mimeType', request.file.type)
  
  // * Captcha
  if (request.captcha_id) formData.append('captcha_id', request.captcha_id)
  if (request.captcha_solution) formData.append('captcha_solution', request.captcha_solution)
  if (request.captcha_token) formData.append('captcha_token', request.captcha_token)

  try {
    const response = await axios.post(`${API_URL}/api/v1/requests/${requestId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = (progressEvent.loaded * 100) / progressEvent.total
          onProgress(percentCompleted, progressEvent.loaded, progressEvent.total)
        }
      }
    })
    return response.data
  } catch (error: any) {
     const errorMessage = error.response?.data?.details 
      ? `${error.response.data.error}: ${error.response.data.details}` 
      : (error.response?.data?.message || error.message || 'Request failed')
    throw new Error(errorMessage)
  }
}

/**
 * Chunked Upload Implementation
 */

// * Init
async function initMultipartUpload(
  request: Omit<UploadRequest, 'encryptedData'> & { chunkSize: number }
): Promise<{ uploadToken: string, uploadId: string, shareId: string }> {
  const formData = new FormData()
  
  formData.append('encryptedFilename', request.encryptedFilename)
  formData.append('iv', arrayBufferToBase64(request.iv))
  formData.append('fileSize', request.file.size.toString())
  formData.append('mimeType', request.file.type)
  formData.append('chunkSize', request.chunkSize.toString())
  
  if (request.expirationMinutes) formData.append('expirationMinutes', request.expirationMinutes.toString())
  if (request.password) formData.append('password', request.password)
  if (request.downloadLimit) formData.append('downloadLimit', request.downloadLimit.toString())
  if (request.oneTimeDownload) formData.append('oneTimeDownload', 'true')
  
  if (request.captcha_id) formData.append('captcha_id', request.captcha_id)
  if (request.captcha_solution) formData.append('captcha_solution', request.captcha_solution)
  if (request.captcha_token) formData.append('captcha_token', request.captcha_token)

  try {
    const response = await axios.post(`${API_URL}/api/v1/upload/init`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  } catch (error: any) {
    const errorMessage = error.response?.data?.details 
      ? `${error.response.data.error}: ${error.response.data.details}` 
      : (error.response?.data?.message || error.message || 'Init upload failed')
    throw new Error(errorMessage)
  }
}

// * Part
async function uploadPart(
  uploadToken: string,
  partNumber: number,
  chunk: ArrayBuffer,
  onProgress?: (loaded: number, total: number) => void
): Promise<{ etag: string, partNumber: number }> {
  const formData = new FormData()
  formData.append('uploadToken', uploadToken)
  formData.append('partNumber', partNumber.toString())
  
  const blob = new Blob([chunk], { type: 'application/octet-stream' })
  formData.append('file', blob)

  try {
    const response = await axios.post(`${API_URL}/api/v1/upload/part`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress(progressEvent.loaded, progressEvent.total)
        }
      }
    })
    return response.data
  } catch (error: any) {
     const errorMessage = error.response?.data?.details 
      ? `${error.response.data.error}: ${error.response.data.details}` 
      : (error.response?.data?.message || error.message || 'Upload part failed')
    throw new Error(errorMessage)
  }
}

// * Complete
async function completeMultipartUpload(
  uploadToken: string,
  parts: { partNumber: number, etag: string }[]
): Promise<UploadResponse> {
  try {
    const response = await axios.post(`${API_URL}/api/v1/upload/complete`, {
      uploadToken,
      parts
    })
    return response.data
  } catch (error: any) {
    const errorMessage = error.response?.data?.details 
      ? `${error.response.data.error}: ${error.response.data.details}` 
      : (error.response?.data?.message || error.message || 'Complete upload failed')
    throw new Error(errorMessage)
  }
}

/**
 * Upload a large file in chunks (with chunked encryption)
 */
export async function uploadFileChunked(
  file: File,
  key: CryptoKey,
  request: Omit<UploadRequest, 'encryptedData'>,
  onProgress?: (progress: number, loaded: number, total: number) => void
): Promise<UploadResponse> {
  const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
  
  // * 1. Initialize
  const { uploadToken, shareId } = await initMultipartUpload({ ...request, chunkSize: CHUNK_SIZE })
  
  // * 2. Upload Parts
  const parts = []
  let totalUploaded = 0 // Approximate (original bytes)
  
  // * We can parallelize uploads, but limited browser connections (usually 6)
  // * Sequential is safer for memory and order. 
  // * Parallelism of 3 is good compromise.
  
  // * Sequential loop for now to avoid memory pressure of encrypting multiple chunks at once.
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    
    // * Slice and Encrypt
    const chunkBlob = file.slice(start, end)
    const chunkBuffer = await chunkBlob.arrayBuffer()
    
    // * Encrypt Chunk (Generates new IV, appends [IV][Cipher][Tag])
    const encryptedChunk = await encryptChunk(chunkBuffer, key)
    
    // * Upload Part
    // Retry logic could be added here
    const { etag } = await uploadPart(uploadToken, i + 1, encryptedChunk, (loaded, total) => {
      if (onProgress) {
        const chunkRatio = loaded / total
        const currentChunkProgress = chunkBlob.size * chunkRatio
        const currentTotal = totalUploaded + currentChunkProgress
        const percent = (currentTotal / file.size) * 100
        onProgress(percent, currentTotal, file.size)
      }
    })
    parts.push({ partNumber: i + 1, etag })
    
    // * Update Progress
    totalUploaded += chunkBlob.size
    if (onProgress) {
      // * Calculate percentage based on original file size
      const percent = (totalUploaded / file.size) * 100
      onProgress(percent, totalUploaded, file.size)
    }
  }
  
  // * 3. Complete
  const response = await completeMultipartUpload(uploadToken, parts)
  
  return response
}
