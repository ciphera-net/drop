export interface UploadRequest {
  file: File
  encryptedData: ArrayBuffer
  encryptedFilename: string
  iv: Uint8Array
  fileSize?: number
  mimeType?: string
  expirationMinutes?: number
  password?: string
  downloadLimit?: number
  oneTimeDownload?: boolean
  
  // Captcha
  captcha_id?: string
  captcha_solution?: string
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
