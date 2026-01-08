'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import apiRequest from '@/lib/api/client'
import { FileShare } from '@/lib/types/api'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/context'

export default function DashboardPage() {
  const [files, setFiles] = useState<FileShare[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/login')
      return
    }

    const fetchFiles = async () => {
      try {
        const response = await apiRequest<{ files: FileShare[] }>('/user/files')
        setFiles(response.files || [])
      } catch (err) {
        console.error('Failed to fetch files:', err)
        setError('Failed to load your files')
      } finally {
        setLoadingFiles(false)
      }
    }

    fetchFiles()
  }, [user, authLoading, router])

  const handleDelete = async (shareId: string) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return
    }

    try {
      await apiRequest(`/files/${shareId}`, { method: 'DELETE' })
      setFiles(files.filter(f => f.share_id !== shareId))
      toast.success('File deleted successfully')
    } catch (err) {
      console.error('Failed to delete file:', err)
      toast.error('Failed to delete file')
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (authLoading || loadingFiles) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-900 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Drops</h1>
          <Link
            href="/"
            className="btn-primary text-sm"
          >
            New Drop
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        {files.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 p-12 text-center">
            <h3 className="text-lg font-medium text-neutral-900">No active drops</h3>
            <p className="mt-2 text-sm text-neutral-500">Upload a file to see it here.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Downloads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {files.map((file) => (
                  <tr key={file.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900">
                      {new Date(file.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                      {formatBytes(file.file_size)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                      {file.download_count} 
                      {file.download_limit ? ` / ${file.download_limit}` : ''}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                      {new Date(file.expires_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(file.share_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
