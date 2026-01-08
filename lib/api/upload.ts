/**
 * Upload API calls
 */

import axios from 'axios'
import type { UploadRequest, UploadResponse } from '../types/api'
import { arrayBufferToBase64 } from '../crypto/encryption'

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
  const blob = new Blob([request.encryptedData], { type: 'application/octet-stream' })
  formData.append('file', blob)

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
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
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
  const blob = new Blob([request.encryptedData], { type: 'application/octet-stream' })
  formData.append('file', blob)

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
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
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
