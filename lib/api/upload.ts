/**
 * Upload API calls
 */

import apiRequest from './client'
import type { UploadRequest, UploadResponse, ErrorResponse } from '../types/api'
import { arrayBufferToBase64 } from '../crypto/encryption'

/**
 * Upload an encrypted file
 */
export async function uploadFile(
  request: UploadRequest
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
    expirationDays: request.expirationDays || 7,
    password: request.password,
    downloadLimit: request.downloadLimit,
    oneTimeDownload: request.oneTimeDownload,
  }

  return apiRequest<UploadResponse>('/upload', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
