'use client'

import { useState, useCallback } from 'react'
import { encryptFile, encryptString, arrayBufferToBase64 } from '../lib/crypto/encryption'
import { encodeKeyForSharing } from '../lib/crypto/key-management'
import { uploadFile } from '../lib/api/upload'
import type { UploadRequest } from '../lib/types/api'

interface FileUploadProps {
  onUploadComplete?: (shareUrl: string) => void
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [expirationDays, setExpirationDays] = useState(7)
  const [password, setPassword] = useState('')
  const [downloadLimit, setDownloadLimit] = useState<number | undefined>()
  const [oneTimeDownload, setOneTimeDownload] = useState(false)

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return
    
    const fileArray = Array.from(selectedFiles)
    setFiles((prev) => [...prev, ...fileArray])
    setError(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleUpload = useCallback(async () => {
    if (files.length === 0) {
      setError('Please select at least one file')
      return
    }

    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      // * For now, upload the first file (multi-file support will be added later)
      const file = files[0]

      // * Encrypt file
      const { encrypted, iv, key } = await encryptFile(file)

      // * Encrypt filename
      const encryptedFilenameBuffer = await encryptString(
        file.name,
        key.key,
        iv
      )
      const encryptedFilename = arrayBufferToBase64(encryptedFilenameBuffer)

      // * Prepare upload request
      const uploadRequest: UploadRequest = {
        file,
        encryptedData: encrypted,
        encryptedFilename,
        iv,
        expirationDays,
        password: password || undefined,
        downloadLimit: downloadLimit || undefined,
        oneTimeDownload,
      }

      // * Upload to backend
      const response = await uploadFile(uploadRequest, (progress) => {
        setProgress(progress)
      })

      // * Generate share URL with encryption key
      const encodedKey = encodeKeyForSharing(key.raw)
      const shareUrl = `${window.location.origin}/${response.shareId}#${encodedKey}`

      setProgress(100)

      if (onUploadComplete) {
        onUploadComplete(shareUrl)
      } else {
        // * Copy to clipboard
        await navigator.clipboard.writeText(shareUrl)
        alert('Share link copied to clipboard!')
      }

      // * Reset form
      setFiles([])
      setPassword('')
      setDownloadLimit(undefined)
      setOneTimeDownload(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [files, expirationDays, password, downloadLimit, oneTimeDownload, onUploadComplete])

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* * Drag and drop area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-12 text-center hover:border-brand-orange transition-colors cursor-pointer"
      >
        <input
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="file-input"
          disabled={uploading}
        />
        <label htmlFor="file-input" className="cursor-pointer">
          <div className="space-y-4">
            <p className="text-lg font-medium">
              Drag and drop files here, or click to select
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              Files are encrypted before upload
            </p>
          </div>
        </label>
      </div>

      {/* * Selected files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Selected files:</h3>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
            >
              <span className="text-sm truncate flex-1">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="ml-2 text-red-500 hover:text-red-700 text-sm"
                disabled={uploading}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* * Upload options */}
      {files.length > 0 && (
        <div className="space-y-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-2">
              Expiration (days)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={expirationDays}
              onChange={(e) => setExpirationDays(parseInt(e.target.value) || 7)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Password (optional)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Protect with password"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Download limit (optional)
            </label>
            <input
              type="number"
              min="1"
              value={downloadLimit || ''}
              onChange={(e) =>
                setDownloadLimit(
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              placeholder="Unlimited"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
              disabled={uploading}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="one-time"
              checked={oneTimeDownload}
              onChange={(e) => setOneTimeDownload(e.target.checked)}
              className="mr-2"
              disabled={uploading}
            />
            <label htmlFor="one-time" className="text-sm">
              One-time download
            </label>
          </div>
        </div>
      )}

      {/* * Upload button */}
      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? `Uploading... ${progress}%` : 'Upload & Generate Link'}
        </button>
      )}

      {/* * Error message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
    </div>
  )
}
