'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@ciphera-net/ui'
import apiRequest from '@/lib/api/client'
import { FileShare } from '@/lib/types/api'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/context'
import { formatBytes } from '@/lib/utils/format'
import { PlusIcon, BoxIcon, XIcon } from '@ciphera-net/ui'

const EXPIRING_SOON_DAYS = 7

function getExpiringSoonCount(files: FileShare[]): number {
  const now = new Date()
  const cutoff = new Date(now.getTime() + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000)
  return files.filter((f) => new Date(f.expires_at) <= cutoff).length
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen p-6 pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
          </div>
          <div className="h-10 w-28 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
            />
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-neutral-200 py-4 last:border-0 dark:border-neutral-800"
              >
                <div className="h-10 w-10 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-3 w-24 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
                </div>
                <div className="h-4 w-16 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
                <div className="h-4 w-12 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
                <div className="h-8 w-8 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DropCard({
  file,
  onDelete,
}: {
  file: FileShare
  onDelete: (shareId: string) => void
}) {
  return (
    <div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-orange/10 text-brand-orange">
          <BoxIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
            Encrypted file
          </p>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Uploaded {new Date(file.created_at).toLocaleDateString()} · {formatBytes(file.file_size)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(file.share_id)}
          className="shrink-0 rounded-lg p-2 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          title="Delete"
          aria-label="Delete"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs dark:bg-neutral-800/50">
        <div>
          <span className="text-neutral-500 dark:text-neutral-400">Downloads</span>
          <p className="font-medium text-neutral-900 dark:text-white">
            {file.download_count}
            {file.download_limit != null ? ` / ${file.download_limit}` : ''}
          </p>
        </div>
        <div>
          <span className="text-neutral-500 dark:text-neutral-400">Expires</span>
          <p className="font-medium text-neutral-900 dark:text-white">
            {new Date(file.expires_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}

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
      setFiles(files.filter((f) => f.share_id !== shareId))
      toast.success('File deleted successfully')
    } catch (err) {
      console.error('Failed to delete file:', err)
      toast.error('Failed to delete file')
    }
  }

  if (authLoading || loadingFiles) {
    return <DashboardSkeleton />
  }

  const totalSize = files.reduce((sum, f) => sum + f.file_size, 0)
  const expiringSoon = getExpiringSoonCount(files)

  return (
    <div className="min-h-screen p-6 pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Your Drops</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              View and manage your secure file shares.
            </p>
          </div>
          <Link
            href="/"
            className="btn-primary inline-flex items-center justify-center gap-2 text-sm sm:shrink-0"
          >
            <PlusIcon className="h-4 w-4" />
            New Drop
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Drops</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
              {files.length}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Storage used</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
              {formatBytes(totalSize)}
            </p>
          </div>
          <div className="rounded-xl border border-brand-orange/20 bg-brand-orange/10 p-4 dark:border-neutral-800">
            <p className="text-sm text-brand-orange">Expiring soon</p>
            <p className="mt-1 text-2xl font-bold text-brand-orange">{expiringSoon}</p>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Within {EXPIRING_SOON_DAYS} days
            </p>
          </div>
        </div>

        {files.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 p-12 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800">
              <BoxIcon className="h-8 w-8 text-brand-orange" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
              No active drops
            </h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Upload a file to see it here.
            </p>
            <Link href="/" className="btn-primary mt-6 inline-flex items-center gap-2 text-sm">
              <PlusIcon className="h-4 w-4" />
              New Drop
            </Link>
          </div>
        ) : (
          <>
            {/* * Mobile: card layout */}
            <div className="space-y-4 md:hidden">
              {files.map((file) => (
                <DropCard key={file.id} file={file} onDelete={handleDelete} />
              ))}
            </div>

            {/* * Desktop: table */}
            <div className="hidden overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
                        scope="col"
                      >
                        File
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
                        scope="col"
                      >
                        Uploaded
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
                        scope="col"
                      >
                        Size
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
                        scope="col"
                      >
                        Downloads
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
                        scope="col"
                      >
                        Expires
                      </th>
                      <th
                        className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
                        scope="col"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                    {files.map((file) => (
                      <tr
                        key={file.id}
                        className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-orange/10 text-brand-orange">
                              <BoxIcon className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-medium text-neutral-900 dark:text-white">
                              Encrypted file
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300">
                          {new Date(file.created_at).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                          {formatBytes(file.file_size)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                          {file.download_count}
                          {file.download_limit != null ? ` / ${file.download_limit}` : ''}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                          {new Date(file.expires_at).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(file.share_id)}
                            className="inline-flex rounded-lg p-2 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            title="Delete"
                            aria-label="Delete"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
