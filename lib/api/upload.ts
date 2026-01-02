/**
 * Upload API calls
 */

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
  // * Convert encrypted data to base64 for JSON transmission
  const encryptedDataBase64 = arrayBufferToBase64(request.encryptedData)
  const ivBase64 = arrayBufferToBase64(request.iv)

  const body = {
    encryptedData: encryptedDataBase64,
    encryptedFilename: request.encryptedFilename,
    iv: ivBase64,
    fileSize: request.file.size,
    mimeType: request.file.type,
    expirationMinutes: request.expirationMinutes || 10080, // Default 7 days
    password: request.password,
    downloadLimit: request.downloadLimit,
    oneTimeDownload: request.oneTimeDownload,
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_URL}/api/v1/upload`)
    xhr.setRequestHeader('Content-Type', 'application/json')

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100
          onProgress(Math.round(percentComplete), event.loaded, event.total)
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } catch (e) {
          reject(new Error('Invalid JSON response'))
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText)
          // * Include details if available
          const errorMessage = error.details ? `${error.error}: ${error.details}` : (error.message || error.error || 'Request failed')
          reject(new Error(errorMessage))
        } catch (e) {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
        }
      }
    }

    xhr.onerror = () => reject(new Error('Network request failed'))

    xhr.send(JSON.stringify(body))
  })
}

/**
 * Upload an encrypted file to a specific request
 */
export async function uploadToRequest(
  requestId: string,
  request: UploadRequest,
  onProgress?: (progress: number, loaded: number, total: number) => void
): Promise<UploadResponse> {
  // * Convert encrypted data to base64 for JSON transmission
  const encryptedDataBase64 = arrayBufferToBase64(request.encryptedData)
  const ivBase64 = arrayBufferToBase64(request.iv)

  const body = {
    encryptedData: encryptedDataBase64,
    encryptedFilename: request.encryptedFilename,
    iv: ivBase64,
    fileSize: request.file.size,
    mimeType: request.file.type,
    // Expiration and limits are controlled by the Request config, not the uploader
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_URL}/api/v1/requests/${requestId}/upload`)
    xhr.setRequestHeader('Content-Type', 'application/json')

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100
          onProgress(Math.round(percentComplete), event.loaded, event.total)
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } catch (e) {
          reject(new Error('Invalid JSON response'))
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText)
          const errorMessage = error.details ? `${error.error}: ${error.details}` : (error.message || error.error || 'Request failed')
          reject(new Error(errorMessage))
        } catch (e) {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
        }
      }
    }

    xhr.onerror = () => reject(new Error('Network request failed'))

    xhr.send(JSON.stringify(body))
  })
}
