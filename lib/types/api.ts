/**
 * API request/response types
 */

export interface UploadRequest {
  file: File
  encryptedData: ArrayBuffer
  encryptedFilename: string
  iv: Uint8Array
  expirationMinutes?: number
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
  iv: ArrayBuffer // Base64 encoded -> ArrayBuffer
  expiresAt: string // ISO 8601 timestamp
  downloadCount: number
  downloadLimit?: number
  oneTimeDownload?: boolean
}

export interface FileMetadata {
  shareId: string
  fileSize: number
  expiresAt: string
  passwordProtected: boolean
  downloadCount: number
  downloadLimit?: number
  oneTimeDownload: boolean
}

export interface FileShare {
  id: string
  share_id: string
  encrypted_filename: string
  file_size: number
  mime_type: string
  expires_at: string
  download_count: number
  download_limit?: number
  one_time_download: boolean
  created_at: string
}

export interface CreateRequestParams {
  encryptedTitle: string
  encryptedDescription?: string
  iv: string // Base64
  expirationMinutes?: number
  maxUploads?: number
}

export interface CreateRequestResponse {
  requestId: string
  requestUrl: string
  expiresAt: string
}

export interface FileRequest {
  id: string
  request_id: string
  title?: string // Decrypted on client
  description?: string // Decrypted on client
  encryptedTitle?: string
  encryptedDescription?: string
  iv?: string // Base64
  expires_at: string
  max_uploads?: number
  created_at: string
}

export interface ErrorResponse {
  error: string
  message?: string
  code?: string
}
