'use client'

import { useState, useEffect } from 'react'
import { toast } from '@ciphera-net/ui'
import { downloadFile } from '../lib/api/download'
import { getFileMetadata } from '../lib/api/metadata'
import { decryptFile, decryptString, base64ToArrayBuffer } from '../lib/crypto/encryption'
import { decodeKeyFromSharing, importEncryptionKey } from '../lib/crypto/key-management'
import { FileMetadata } from '../lib/types/api'
import { formatBytes } from '../lib/utils/format'
import { BoxIcon, LockIcon } from '@ciphera-net/ui'
import { PasswordInput } from '@ciphera-net/ui'

interface DownloadPageProps {
  shareId: string
  encryptionKey?: string // From URL hash
  initialMetadata?: FileMetadata
}

export default function DownloadPage({ shareId, encryptionKey, initialMetadata }: DownloadPageProps) {
  const [password, setPassword] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filename, setFilename] = useState<string | null>(null)
  const [isBurned, setIsBurned] = useState(false)
  const [isPasswordProtected, setIsPasswordProtected] = useState(initialMetadata?.passwordProtected || false)
  const [metadataLoaded, setMetadataLoaded] = useState(!!initialMetadata)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [decrypting, setDecrypting] = useState(false)
  const [metadata, setMetadata] = useState<FileMetadata | null>(initialMetadata || null)

  useEffect(() => {
    // * Extract encryption key from URL hash
    // (Keep this logic, it's specific to the client)
    if (typeof window !== 'undefined' && window.location.hash) {
      // Logic to handle hash if needed, currently passed as prop or handled here?
      // The original code handled it here if not passed as prop.
      // But wait, the parent server component doesn't pass encryptionKey anymore because it can't read the hash.
      // So we rely on this useEffect to set it if not passed?
      // Actually, the previous implementation of page.tsx was client side and read the hash.
      // Now page.tsx is server side and CANNOT read the hash.
      // So encryptionKey prop will likely be undefined from the server component.
      // We need to make sure we still read the hash here.
    }
    
    // * Fetch metadata ONLY if not provided by server
    if (!initialMetadata) {
      const fetchMetadata = async () => {
        try {
          const fetchedMetadata = await getFileMetadata(shareId)
          setMetadata(fetchedMetadata)
          setIsPasswordProtected(fetchedMetadata.passwordProtected)
          if (fetchedMetadata.oneTimeDownload && fetchedMetadata.downloadLimit && fetchedMetadata.downloadCount >= fetchedMetadata.downloadLimit) {
              // Check if it's already burned (though API usually returns Gone or Forbidden)
               setIsBurned(true)
          }
        } catch (err) {
          // Don't block loading on metadata failure, but it might indicate file not found
          console.error('Failed to load metadata:', err)
          setError(err instanceof Error ? err.message : 'Failed to load file info')
        } finally {
          setMetadataLoaded(true)
        }
      }
      fetchMetadata()
    } else {
      setMetadata(initialMetadata)
      // If we have initialMetadata, we still might need to check "burned" status logic
      if (initialMetadata.oneTimeDownload && initialMetadata.downloadLimit && initialMetadata.downloadCount >= initialMetadata.downloadLimit) {
         setIsBurned(true)
      }
    }
  }, [shareId, initialMetadata])

  // We need a separate effect to read the hash for the key, since the server component can't see it.
  // The original component had this logic mixed in.
  // We'll add a state for the key if it's not passed in.
  const [localEncryptionKey, setLocalEncryptionKey] = useState<string | undefined>(encryptionKey)

  useEffect(() => {
     if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1) // Remove #
      if (hash) {
        setLocalEncryptionKey(hash)
      }
    }
  }, [])

  const handleDownload = async (keyFromHash?: string) => {
    // * Pre-check password requirement
    if (isPasswordProtected && !password) {
      setError('Password is required to download this file')
      return
    }

    const key = keyFromHash || localEncryptionKey
    if (!key) {
      setError('Encryption key is required')
      return
    }

    setDownloading(true)
    setDecrypting(false)
    setDownloadProgress(0)
    setError(null)

    try {
      // * Download encrypted file
      const response = await downloadFile(shareId, password || undefined, (progress) => {
        setDownloadProgress(progress)
      })

      if (response.oneTimeDownload) {
        setIsBurned(true)
      }

      setDecrypting(true)
      // * Artificial delay for UX if download was too fast, so user sees the "Decrypting" state
      await new Promise(resolve => setTimeout(resolve, 500))

      // * Decode encryption key
      const decodedKey = decodeKeyFromSharing(key)
      const cryptoKey = await importEncryptionKey(decodedKey)

      // * Decrypt file
      const { decrypted } = await decryptFile(
        response.encryptedData,
        decodedKey,
        new Uint8Array(response.iv),
        response.chunkSize
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
      
      toast.success('File decrypted and downloaded successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed'
      setError(errorMessage)
      toast.error(errorMessage)
      setDecrypting(false)
      setDownloading(false)
    }
  }

  // * Format expiration date
  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Expired'
    if (diffDays === 0) return 'Expires today'
    if (diffDays === 1) return 'Expires tomorrow'
    if (diffDays <= 7) return `Expires in ${diffDays} days`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="w-full space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Ready to <span className="text-brand-orange">Download</span>
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-base">
          Secure file transfer powered by Drop
        </p>
      </div>

      {/* * File Info Card */}
      <div className="bg-white dark:bg-neutral-900 p-6 md:p-8 rounded-3xl shadow-xl shadow-brand-orange/5 dark:shadow-none border border-neutral-100/50 dark:border-neutral-800 backdrop-blur-sm space-y-6">
        <div className="flex items-center justify-between p-5 bg-gradient-to-br from-neutral-50 to-neutral-100/50 dark:from-neutral-800 dark:to-neutral-800/50 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-orange/10 dark:bg-brand-orange/20 flex items-center justify-center text-brand-orange shadow-sm">
              <BoxIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">Secure File</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">{shareId.slice(0, 12)}...</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200/50 dark:border-green-800/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-green-700 dark:text-green-400">Encrypted</span>
          </div>
        </div>

        {/* * File Metadata Stats */}
        {metadata && metadataLoaded && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">File Size</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">{formatBytes(metadata.fileSize)}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Downloads</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">
                {metadata.downloadCount}
                {metadata.downloadLimit != null ? ` / ${metadata.downloadLimit}` : ''}
              </p>
            </div>
            <div className={`rounded-xl border p-4 ${
              new Date(metadata.expiresAt) < new Date() 
                ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20'
                : new Date(metadata.expiresAt).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
                ? 'border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-900/20'
                : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
            }`}>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Expires</p>
              <p className={`text-lg font-bold ${
                new Date(metadata.expiresAt) < new Date()
                  ? 'text-red-700 dark:text-red-400'
                  : new Date(metadata.expiresAt).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
                  ? 'text-orange-700 dark:text-orange-400'
                  : 'text-neutral-900 dark:text-white'
              }`}>
                {formatExpirationDate(metadata.expiresAt)}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl flex gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {filename && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 rounded-xl flex gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0">
               <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-sm text-green-800 dark:text-green-300">
              Successfully downloaded <strong>{filename}</strong>
            </p>
          </div>
        )}

        {isBurned && (
          <div className="p-4 bg-orange-50 dark:bg-brand-orange/10 border border-orange-100 dark:border-brand-orange/30 rounded-xl flex gap-3">
            <svg className="w-5 h-5 text-orange-600 dark:text-brand-orange shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
            <p className="text-sm text-orange-800 dark:text-orange-300">
              This file has been burned and is no longer available.
            </p>
          </div>
        )}

        {!localEncryptionKey && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/50 rounded-xl flex gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Encryption key not found. Please ensure you are using the full share link with the hash fragment.
            </p>
          </div>
        )}

        {/* * Security Features */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-neutral-50/50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50">
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <LockIcon className="w-4 h-4 text-brand-orange" />
            <span>End-to-end encrypted</span>
          </div>
          {isPasswordProtected && (
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <LockIcon className="w-4 h-4 text-brand-orange" />
              <span>Password protected</span>
            </div>
          )}
          {metadata?.oneTimeDownload && (
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <svg className="w-4 h-4 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
              <span>One-time download</span>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <PasswordInput
              label="Password Protection"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error === 'Password is required to download this file') setError(null)
              }}
              placeholder={isPasswordProtected ? "Enter password to unlock" : "Enter password (if required)"}
              required={isPasswordProtected}
              error={error === 'Password is required to download this file' ? 'Required' : undefined}
              disabled={downloading || isBurned || (!metadataLoaded)}
            />
          </div>

          <button
            onClick={() => handleDownload()}
            disabled={downloading || !localEncryptionKey || isBurned}
            className="w-full btn-primary py-3 text-lg shadow-lg shadow-brand-orange/20 hover:shadow-xl hover:shadow-brand-orange/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
          >
            {downloading ? (
              <div className="flex flex-col items-center w-full relative z-10">
                 <div className="flex items-center gap-2 mb-1">
                    {decrypting ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Decrypting...</span>
                        </>
                    ) : (
                        <span>Downloading {downloadProgress}%</span>
                    )}
                 </div>
                 {/* Progress Bar Background */}
                 {!decrypting && (
                   <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden max-w-[200px]">
                      <div 
                        className="h-full bg-white transition-all duration-200 ease-out"
                        style={{ width: `${downloadProgress}%` }}
                      />
                   </div>
                 )}
              </div>
            ) : isBurned ? (
              'File Unavailable'
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download Securely
              </>
            )}
          </button>
        </div>
      </div>
      
      <p className="text-center text-sm text-neutral-400">
        End-to-end encrypted • Zero-knowledge architecture
      </p>
    </div>
  )
}
