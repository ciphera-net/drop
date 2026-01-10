import apiRequest from './client'
import type { FileShare } from '@/lib/types/api'

export async function getUserFiles(): Promise<{ files: FileShare[] }> {
  return apiRequest<{ files: FileShare[] }>('/user/files')
}

export async function deleteUserFile(shareId: string): Promise<void> {
  return apiRequest<void>(`/files/${shareId}`, {
    method: 'DELETE',
  })
}

export async function deleteAllUserFiles(): Promise<void> {
  return apiRequest<void>('/user/files', {
    method: 'DELETE',
  })
}

export async function deleteAccount(password: string): Promise<void> {
  // This goes to ciphera-auth
  return apiRequest<void>('/auth/user', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  })
}
