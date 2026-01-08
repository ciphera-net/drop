export interface FileRequest {
  requestId: string
  encryptedTitle: string
  encryptedDescription?: string
  iv: string
  expiresAt: string
  maxUploads?: number

  // Decrypted fields added on client
  title?: string
  description?: string
}

export interface UploadRequest {
  file: File
  encryptedData?: ArrayBuffer
  encryptedFilename: string
  iv: Uint8Array
  fileSize?: number
  mimeType?: string
  expirationMinutes?: number
  password?: string
  downloadLimit?: number
  oneTimeDownload?: boolean
  chunkSize?: number
  
  // Captcha
  captcha_id?: string
  captcha_solution?: string
  captcha_token?: string
}

export interface UploadResponse {
  shareId: string
  shareUrl: string
  expiresAt: string
}

export interface FileShare {
  id: string
  share_id: string
  file_size: number
  download_count: number
  download_limit: number | null
  created_at: string
  expires_at: string
}

export interface CreateRequestParams {
  encryptedTitle: string
  encryptedDescription?: string
  iv: string
  expirationMinutes: number
  maxUploads?: number
}

export interface CreateRequestResponse {
  requestId: string
  requestUrl: string
  expiresAt: string
}

export interface DownloadRequest {
  shareId: string
  password?: string
}

export interface DownloadResponse {
  encryptedData: ArrayBuffer
  filename: string // Still encrypted but base64
  iv: ArrayBuffer
  expiresAt: string
  downloadCount: number
  downloadLimit?: number
  oneTimeDownload?: boolean
  chunkSize?: number
}

export interface ErrorResponse {
  error: string
  message?: string
}

export interface FileMetadata {
  shareId: string
  fileSize: number
  expiresAt: string
  passwordProtected: boolean
  downloadCount: number
  downloadLimit: number | null
  oneTimeDownload: boolean
}
