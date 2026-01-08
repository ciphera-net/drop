/**
 * Download API calls
 */

import apiRequest, { API_URL } from './client'
import type { DownloadRequest, DownloadResponse, ErrorResponse } from '../types/api'
import { base64ToArrayBuffer } from '../crypto/encryption'
import axios from 'axios'

/**
 * Get download information and encrypted file data
 */
export async function downloadFile(
  shareId: string,
  password?: string,
  onProgress?: (progress: number) => void
): Promise<DownloadResponse> {
  const body: DownloadRequest = {
    shareId,
    password,
  }

  // Use axios for download progress
  const response = await axios.post<{
    encryptedData: string // Base64
    filename: string
    iv: string // Base64
    expiresAt: string
    downloadCount: number
    downloadLimit?: number
    oneTimeDownload?: boolean
  }>(`${API_URL}/api/v1/download`, body, {
    onDownloadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percentCompleted)
      }
    }
  })

  const data = response.data

  // * Convert base64 strings back to ArrayBuffers
  return {
    encryptedData: base64ToArrayBuffer(data.encryptedData),
    filename: data.filename,
    iv: base64ToArrayBuffer(data.iv),
    expiresAt: data.expiresAt,
    downloadCount: data.downloadCount,
    downloadLimit: data.downloadLimit,
    oneTimeDownload: data.oneTimeDownload,
    chunkSize: data.chunkSize,
  }
}
