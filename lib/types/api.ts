/**
 * API request/response types
 */

export interface UploadRequest {
  file: File
  encryptedData: ArrayBuffer
  encryptedFilename: string
  iv: string // Base64 encoded
  expirationDays?: number
  password?: string // Optional password for share link
  downloadLimit?: number // Optional download limit
  oneTimeDownload?: boolean // Optional one-time download flag
}

export interface UploadResponse {
  shareId: string
  shareUrl: string
  expiresAt: string // ISO 8601 timestamp
  downloadLimit?: number
  oneTimeDownload?: boolean
}

export interface DownloadRequest {
  shareId: string
  password?: string
}

export interface DownloadResponse {
  encryptedData: ArrayBuffer
  filename: string // Encrypted filename
  iv: string // Base64 encoded
  expiresAt: string // ISO 8601 timestamp
  downloadCount: number
  downloadLimit?: number
  oneTimeDownload?: boolean
}

export interface ErrorResponse {
  error: string
  message?: string
  code?: string
}
