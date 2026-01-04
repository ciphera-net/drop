/**
 * Get file metadata
 */
import apiRequest from './client'
import type { FileMetadata } from '../types/api'

export async function getFileMetadata(shareId: string): Promise<FileMetadata> {
  return apiRequest<FileMetadata>(`/files/${shareId}/metadata`)
}
