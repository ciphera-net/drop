'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast, Modal } from '@ciphera-net/ui'
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

const SK = 'animate-pulse rounded bg-neutral-100 dark:bg-neutral-800'

function DashboardSkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className={`${SK} h-8 w-48 mb-2`} />
            <div className={`${SK} h-4 w-64`} />
          </div>
          <div className={`${SK} h-10 w-28 rounded-xl`} />
        </div>
      </div>

      {/* Stats card */}
      <div className="mb-8">
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className={`${SK} h-4 w-20`} />
                <div className={`${SK} h-8 w-24`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`${SK} h-12 w-12 rounded-lg shrink-0`} />
              <div className="flex-1 space-y-2">
                <div className={`${SK} h-4 w-32`} />
                <div className={`${SK} h-3 w-48`} />
              </div>
            </div>
            <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800/50 p-3 grid grid-cols-2 gap-4">
              <div>
                <div className={`${SK} h-3 w-16 mb-1`} />
                <div className={`${SK} h-5 w-12`} />
              </div>
              <div>
                <div className={`${SK} h-3 w-12 mb-1`} />
                <div className={`${SK} h-5 w-20`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DropCard({
  file,
  onDeleteClick,
}: {
  file: FileShare
  onDeleteClick: (shareId: string) => void
}) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      {/* Header: Icon + Name + Delete */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800">
            <BoxIcon className="h-6 w-6 text-brand-orange" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">Encrypted file</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Uploaded {new Date(file.created_at).toLocaleDateString()} · {formatBytes(file.file_size)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDeleteClick(file.share_id)}
          className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
          title="Delete"
          aria-label="Delete"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Mini stats */}
      <div className="mt-auto rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Downloads</p>
            <p className="font-mono text-lg font-medium text-neutral-900 dark:text-white">
              {file.download_count}
              {file.download_limit != null ? ` / ${file.download_limit}` : ''}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Expires</p>
            <p className="font-mono text-lg font-medium text-neutral-900 dark:text-white">
              {new Date(file.expires_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [files, setFiles] = useState<FileShare[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [shareIdToDelete, setShareIdToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
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

  const openDeleteModal = (shareId: string) => {
    setShareIdToDelete(shareId)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setShareIdToDelete(null)
  }

  const handleDelete = async () => {
    if (!shareIdToDelete) return

    setIsDeleting(true)
    try {
      await apiRequest(`/files/${shareIdToDelete}`, { method: 'DELETE' })
      setFiles((prev) => prev.filter((f) => f.share_id !== shareIdToDelete))
      toast.success('File deleted successfully')
      closeDeleteModal()
    } catch (err) {
      console.error('Failed to delete file:', err)
      toast.error('Failed to delete file')
    } finally {
      setIsDeleting(false)
    }
  }

  if (authLoading || loadingFiles) {
    return <DashboardSkeleton />
  }

  const totalSize = files.reduce((sum, f) => sum + f.file_size, 0)
  const expiringSoon = getExpiringSoonCount(files)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              Your Drops
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              View and manage your secure file shares.
            </p>
          </div>
          <Link
            href="/"
            className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            <PlusIcon className="h-4 w-4" />
            New Drop
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stats: unified card (Pulse Chart style) */}
      <div className="mb-8">
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Drops</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
                {files.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Storage used</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
                {formatBytes(totalSize)}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Expiring soon</p>
              <p className="mt-1 text-2xl font-bold text-brand-orange">{expiringSoon}</p>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                Within {EXPIRING_SOON_DAYS} days
              </p>
            </div>
          </div>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center gap-4 p-12 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 p-4">
            <BoxIcon className="h-8 w-8 text-brand-orange" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
              No active drops
            </h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Upload a file to see it here.
            </p>
          </div>
          <Link
            href="/"
            className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            <PlusIcon className="h-4 w-4" />
            New Drop
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <DropCard key={file.id} file={file} onDeleteClick={openDeleteModal} />
          ))}
        </div>
      )}

      {/* Delete confirmation modal (Pulse-style) */}
      <Modal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        title={<span className="text-lg font-semibold text-red-600 dark:text-red-500">Delete file?</span>}
        className="border-red-200 dark:border-red-900 max-w-sm"
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          Are you sure you want to delete this file? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={closeDeleteModal}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </motion.div>
  )
}
