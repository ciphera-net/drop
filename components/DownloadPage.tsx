'use client'

import { useState, useEffect } from 'react'
import { downloadFile } from '../lib/api/download'
import { decryptFile, decryptString, base64ToArrayBuffer } from '../lib/crypto/encryption'
import { decodeKeyFromSharing, importEncryptionKey } from '../lib/crypto/key-management'

interface DownloadPageProps {
  shareId: string
  encryptionKey?: string // From URL hash
}

export default function DownloadPage({ shareId, encryptionKey }: DownloadPageProps) {
  const [password, setPassword] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filename, setFilename] = useState<string | null>(null)

  useEffect(() => {
    // * If encryption key is in URL hash, extract it
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1) // Remove #
      if (hash && !encryptionKey) {
        // * Key is in URL hash
        handleDownload(hash)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDownload = async (keyFromHash?: string) => {
    const key = keyFromHash || encryptionKey
    if (!key) {
      setError('Encryption key is required')
      return
    }

    setDownloading(true)
    setError(null)

    try {
      // * Download encrypted file
      const response = await downloadFile(shareId, password || undefined)

      // * Decode encryption key
      const decodedKey = decodeKeyFromSharing(key)
      const cryptoKey = await importEncryptionKey(decodedKey)

      // * Decrypt file
      const { decrypted } = await decryptFile(
        response.encryptedData,
        decodedKey,
        new Uint8Array(response.iv)
      )

      // * Decrypt filename
      const decryptedFilename = await decryptString(
        base64ToArrayBuffer(response.filename),
        cryptoKey,
        new Uint8Array(response.iv)
      )

      setFilename(decryptedFilename)

      // * Create download link
      const blob = new Blob([decrypted])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = decryptedFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Download File</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Share ID: {shareId}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {filename && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            Downloaded: {filename}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Password (if required)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password if file is protected"
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
            disabled={downloading}
          />
        </div>

        <button
          onClick={() => handleDownload()}
          disabled={downloading || !encryptionKey}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? 'Downloading...' : 'Download File'}
        </button>
      </div>

      {!encryptionKey && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Encryption key not found. Please use the full share link.
          </p>
        </div>
      )}
    </div>
  )
}
