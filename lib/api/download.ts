/**
 * Download API calls
 */

import apiRequest from './client'
import type { DownloadRequest, DownloadResponse, ErrorResponse } from '../types/api'
import { base64ToArrayBuffer } from '../crypto/encryption'

/**
 * Get download information and encrypted file data
 */
export async function downloadFile(
  shareId: string,
  password?: string
): Promise<DownloadResponse> {
  const body: DownloadRequest = {
    shareId,
    password,
  }

  const response = await apiRequest<{
    encryptedData: string // Base64
    filename: string
    iv: string // Base64
    expiresAt: string
    downloadCount: number
    downloadLimit?: number
    oneTimeDownload?: boolean
  }>('/download', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  // * Convert base64 strings back to ArrayBuffers
  return {
    encryptedData: base64ToArrayBuffer(response.encryptedData),
    filename: response.filename,
    iv: base64ToArrayBuffer(response.iv),
    expiresAt: response.expiresAt,
    downloadCount: response.downloadCount,
    downloadLimit: response.downloadLimit,
    oneTimeDownload: response.oneTimeDownload,
  }
}
