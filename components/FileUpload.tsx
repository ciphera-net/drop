'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import JSZip from 'jszip'
import { toast } from 'sonner'
import { encryptFile, encryptString, arrayBufferToBase64 } from '../lib/crypto/encryption'
import { encodeKeyForSharing, importEncryptionKey, generateEncryptionKey } from '../lib/crypto/key-management'
import { uploadFile, uploadToRequest } from '../lib/api/upload'
import { uploadFileChunked } from '../lib/api/chunked'
import type { UploadRequest } from '../lib/types/api'
import { MAX_FILE_SIZE } from '../lib/constants'
import { useAuth } from '../lib/auth/context'
import { formatBytes } from '../lib/utils/format'

import PasswordInput from './PasswordInput'
import Captcha from './Captcha'

interface FileUploadProps {
  onUploadComplete?: (shareUrl: string) => void
  requestId?: string
  requestKey?: Uint8Array
}

export default function FileUpload({ onUploadComplete, requestId, requestKey }: FileUploadProps) {
  const { user } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [encrypting, setEncrypting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState<string>('')
  const lastUploadRef = useRef<{ loaded: number; time: number }>({ loaded: 0, time: 0 })
  const [error, setError] = useState<string | null>(null)
  const [expirationMinutes, setExpirationMinutes] = useState(60) // Default 1 Hour
  const [password, setPassword] = useState('')
  const [downloadLimit, setDownloadLimit] = useState<number | undefined>()
  const [oneTimeDownload, setOneTimeDownload] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Captcha State
  const [captchaId, setCaptchaId] = useState('')
  const [captchaSolution, setCaptchaSolution] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')

  const EXPIRATION_OPTIONS = [
    { label: '1 Hour', value: 60 },
    { label: '1 Day', value: 1440 },
    { label: '7 Days', value: 10080 },
  ]

  const DOWNLOAD_LIMITS = [
    { label: '10', value: 10 },
    { label: '50', value: 50 },
    { label: '∞', value: undefined },
  ]

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return
    
    const fileArray = Array.from(selectedFiles)
    const validFiles: File[] = []
    let errorMsg: string | null = null

    fileArray.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        errorMsg = `File ${file.name} is too large. Max size is 5GB.`
      } else {
        validFiles.push(file)
      }
    })

    if (errorMsg) {
      setError(errorMsg)
    } else {
      setError(null)
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles])
    }
    
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // * Handle paste events for file upload
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept paste if user is typing in an input/textarea
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return
      }

      if (e.clipboardData?.files?.length) {
        e.preventDefault()
        handleFileSelect(e.clipboardData.files)
        toast.info('File pasted from clipboard')
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Add drag highlight style
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleCaptchaVerify = useCallback((id: string, solution: string, token?: string) => {
    setCaptchaId(id)
    setCaptchaSolution(solution)
    if (token) setCaptchaToken(token)
  }, [])

  const handleUpload = useCallback(async () => {
    if (files.length === 0) {
      setError('Please select at least one file')
      return
    }

    // Require captcha for anonymous uploads (unless it's a request upload)
    // * PoW captcha uses token, traditional captcha uses id + solution
    const hasCaptchaToken = captchaToken && captchaToken.trim() !== ''
    const hasCaptchaSolution = captchaId && captchaSolution && captchaId.trim() !== '' && captchaSolution.trim() !== ''
    if (!user && !requestId && !hasCaptchaToken && !hasCaptchaSolution) {
      setError('Please complete the security check')
      return
    }

    setUploading(true)
    setEncrypting(true)
    setError(null)
    setProgress(0)
    setUploadSpeed('')
    
    let shareUrl = '' // Initialize variable

    try {
      let fileToUpload: File

      // * Check for zip creation
      // * If uploading to request, we might want to zip as well? Yes, consistent behavior.
      if (files.length > 1) {
        // * Create zip for multiple files
        const zip = new JSZip()
        files.forEach((file) => {
          zip.file(file.name, file)
        })
        
        // * Update progress to indicate compression
        const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
            setProgress(metadata.percent)
        })
        fileToUpload = new File([content], 'archive.zip', { type: 'application/zip' })
      } else {
        fileToUpload = files[0]
      }

      if (fileToUpload.size > MAX_FILE_SIZE) {
        throw new Error(`File ${fileToUpload.name} is too large. Max size is 5GB.`)
      }

      // * Check if we should use Chunked Upload (>100MB)
      // * Currently only supported for direct uploads, not requests (TODO)
      if (fileToUpload.size > 100 * 1024 * 1024 && !requestId) {
        // * Use Chunked Upload Strategy
        const metadata = {
          file: fileToUpload,
          expirationMinutes,
          password: password || undefined,
          downloadLimit: downloadLimit || undefined,
          oneTimeDownload,
          captcha_id: !user ? captchaId : undefined,
          captcha_solution: !user ? captchaSolution : undefined,
          captcha_token: !user ? captchaToken : undefined,
        }

        const response = await uploadFileChunked(
          fileToUpload,
          requestKey || null,
          metadata,
          (progress, loaded, total) => {
             // Update progress
             const now = Date.now()
             const timeDiff = now - lastUploadRef.current.time
             
             if (timeDiff > 500) {
               const loadedDiff = loaded - lastUploadRef.current.loaded
               // Avoid negative speed if chunk reset
               if (loadedDiff > 0) {
                   const speedBytesPerSecond = (loadedDiff / timeDiff) * 1000
                   setUploadSpeed(formatBytes(speedBytesPerSecond) + '/s')
               }
               lastUploadRef.current = { loaded, time: now }
             }
             setProgress(progress)
          }
        )
        
        // shareUrl is returned fully constructed
        shareUrl = response.shareUrl
        setEncrypting(false) // Just in case
        
      } else {
        // * Standard Upload Strategy
        let shareId: string | undefined = undefined // Define in outer scope
        
        // * Prepare Encryption Key
        let encryptionKey
        if (requestKey) {
          // * Import provided key (Uint8Array) to CryptoKey
          const cryptoKey = await importEncryptionKey(requestKey)
          encryptionKey = { key: cryptoKey, raw: requestKey }
        }
        
        // * Encrypt file
        const { encrypted, iv, key } = await encryptFile(fileToUpload, encryptionKey)
        setEncrypting(false) // Encryption done, start upload

        // * Encrypt filename
        const encryptedFilenameBuffer = await encryptString(
          fileToUpload.name,
          key.key,
          iv
        )
        const encryptedFilename = arrayBufferToBase64(encryptedFilenameBuffer)

        // * Prepare upload request
        const uploadRequest: UploadRequest = {
          file: fileToUpload,
          encryptedData: encrypted,
          encryptedFilename,
          iv,
          expirationMinutes: !requestId ? expirationMinutes : undefined,
          password: !requestId ? (password || undefined) : undefined,
          downloadLimit: !requestId ? (downloadLimit || undefined) : undefined,
          oneTimeDownload: !requestId ? oneTimeDownload : undefined,
          captcha_id: !user && !requestId ? captchaId : undefined,
          captcha_solution: !user && !requestId ? captchaSolution : undefined,
          captcha_token: !user && !requestId ? captchaToken : undefined,
        }

        // * Upload to backend
        lastUploadRef.current = { loaded: 0, time: Date.now() }
        
        const onProgressCallback = (progress: number, loaded: number, total: number) => {
          const now = Date.now()
          const timeDiff = now - lastUploadRef.current.time
          
          // Update speed every 500ms
          if (timeDiff > 500) {
            const loadedDiff = loaded - lastUploadRef.current.loaded
            const speedBytesPerSecond = (loadedDiff / timeDiff) * 1000
            setUploadSpeed(formatBytes(speedBytesPerSecond) + '/s')
            
            lastUploadRef.current = { loaded, time: now }
          }
          
          setProgress(progress)
        }

        if (requestId) {
          // * Upload to Request
          await uploadToRequest(requestId, uploadRequest, onProgressCallback)
          shareUrl = 'sent' // Special flag or just indicate success
        } else {
          // * Normal Upload
          const response = await uploadFile(uploadRequest, onProgressCallback)
          shareId = response.shareId // Store ID
          
          // * Generate share URL with encryption key
          const encodedKey = encodeKeyForSharing(key.raw)
          shareUrl = `${window.location.origin}/${response.shareId}#${encodedKey}`
        }
      }

      setProgress(100)

      if (onUploadComplete) {
        onUploadComplete(shareUrl)
      } else if (!requestId) {
        // * Copy to clipboard for normal shares
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Share link copied to clipboard!')
      }

      // * Reset form
      setFiles([])
      if (!requestId) {
        setPassword('')
        setDownloadLimit(undefined)
        setOneTimeDownload(false)
        setCaptchaSolution('') // Reset captcha for next upload
        setCaptchaToken('')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      toast.error(errorMessage)
      setCaptchaSolution('') // Reset captcha on error too
      setCaptchaToken('')
    } finally {
      setUploading(false)
      setEncrypting(false)
      setProgress(0)
    }
  }, [files, expirationMinutes, password, downloadLimit, oneTimeDownload, onUploadComplete, requestId, requestKey, user, captchaId, captchaSolution, captchaToken])

  return (
    <div className={`w-full max-w-md mx-auto ${files.length > 0 ? 'space-y-6' : ''}`}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        id="file-input"
        disabled={uploading}
      />

      {/* * Drag and drop area */}
      {files.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="group relative aspect-square border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-brand-orange dark:hover:border-brand-orange bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-brand-orange/5 dark:hover:bg-brand-orange/10 rounded-2xl p-12 text-center transition-all duration-300 ease-in-out cursor-pointer"
        >
          <label htmlFor="file-input" className="cursor-pointer w-full h-full block">
            <div className="space-y-4 flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 rounded-full bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                <svg 
                  className="w-8 h-8 text-neutral-400 dark:text-neutral-500 group-hover:text-brand-orange transition-colors" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold text-neutral-700 dark:text-neutral-200 group-hover:text-brand-orange transition-colors">
                  {requestId ? 'Upload Requested Files' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                  Files are encrypted client-side before being uploaded. Maximum file size 5GB.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 bg-white/50 dark:bg-neutral-800/50 px-3 py-1.5 rounded-full border border-neutral-100 dark:border-neutral-800">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>End-to-end encrypted</span>
              </div>
            </div>
          </label>
        </div>
      )}

      {/* * Selected files */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-neutral-900 dark:text-white">Selected files</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{files.length} file{files.length !== 1 ? 's' : ''}</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-orange bg-brand-orange/5 dark:bg-brand-orange/10 hover:bg-brand-orange/10 dark:hover:bg-brand-orange/20 rounded-xl transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add more
              </button>
            </div>
          </div>
          {files.map((file, index) => (
            <div
              key={index}
              className="relative group flex items-center p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm hover:border-brand-orange/30 hover:shadow-md transition-all duration-200"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-brand-orange/10 rounded-lg flex items-center justify-center mr-4 text-brand-orange">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatBytes(file.size)}
                </p>
              </div>

              <button
                onClick={() => removeFile(index)}
                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                disabled={uploading}
                title="Remove file"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* * Upload options (Only show if NOT a request) */}
      {!requestId && files.length > 0 && (
        <div className="space-y-5 pt-2">
          <div className="grid grid-cols-1 gap-6">
            {/* Expiration */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Expiration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {EXPIRATION_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => setExpirationMinutes(option.value)}
                    disabled={uploading}
                    className={`px-3 py-2 text-sm font-medium rounded-xl border transition-all duration-200 ${
                      expirationMinutes === option.value
                        ? 'bg-brand-orange text-white border-brand-orange shadow-md shadow-brand-orange/20'
                        : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-brand-orange/50 hover:bg-brand-orange/5 dark:hover:bg-brand-orange/10'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Download Limit */}
            <div className={`space-y-2 transition-opacity duration-200 ${oneTimeDownload ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Download limit
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DOWNLOAD_LIMITS.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => setDownloadLimit(option.value)}
                    disabled={uploading || oneTimeDownload}
                    className={`px-3 py-2 text-sm font-medium rounded-xl border transition-all duration-200 ${
                      downloadLimit === option.value
                        ? 'bg-brand-orange text-white border-brand-orange shadow-md shadow-brand-orange/20'
                        : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-brand-orange/50 hover:bg-brand-orange/5 dark:hover:bg-brand-orange/10'
                    }`}
                  >
                    {option.label === '∞' ? <span className="text-3xl leading-none -mt-1 block">∞</span> : option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Burn after download (Switch) */}
          <div className={`flex items-center justify-between p-4 border rounded-xl transition-all duration-200 ${
            oneTimeDownload 
              ? 'bg-orange-50 dark:bg-brand-orange/10 border-brand-orange shadow-sm' 
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors duration-200 ${
                oneTimeDownload ? 'bg-brand-orange text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
              }`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
              </div>
              <div className="space-y-0.5">
                <span className={`block text-sm font-medium transition-colors duration-200 ${
                  oneTimeDownload ? 'text-brand-orange' : 'text-neutral-900 dark:text-white'
                }`}>
                  Burn after download
                </span>
                <span className={`block text-xs transition-colors duration-200 ${
                  oneTimeDownload ? 'text-brand-orange/80' : 'text-neutral-500 dark:text-neutral-400'
                }`}>
                  File will be deleted after first download
                </span>
              </div>
            </div>
            <button
              onClick={() => setOneTimeDownload(!oneTimeDownload)}
              disabled={uploading}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                oneTimeDownload ? 'bg-brand-orange' : 'bg-neutral-200 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  oneTimeDownload ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Password */}
          <div>
            <PasswordInput
              label="Password protection"
              value={password}
              onChange={setPassword}
              placeholder="Optional password"
              disabled={uploading}
            />
          </div>

          {/* Captcha */}
          {!user && (
            <div className="pt-2">
              <Captcha 
                onVerify={handleCaptchaVerify} 
                className={uploading ? 'opacity-50 pointer-events-none' : ''}
              />
            </div>
          )}
        </div>
      )}

      {/* * Upload button or Progress */}
      {files.length > 0 && (
        uploading ? (
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
            <div className="flex justify-between items-center text-sm font-medium text-neutral-700 dark:text-neutral-300">
              <span className="flex items-center gap-2">
                {encrypting ? (
                  <>
                    <svg className="w-4 h-4 text-brand-orange animate-spin" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{files.length > 1 ? 'Compressing...' : 'Encrypting and uploading...'}</span>
                  </>
                ) : (
                   <>
                    <svg className="w-4 h-4 text-brand-orange animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Uploading...</span>
                   </>
                )}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-brand-orange h-2 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span>{encrypting && !uploadSpeed ? 'Preparing file' : 'Transferring securely'}</span>
              <span>{uploadSpeed}</span>
            </div>
          </div>
        ) : (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {requestId ? 'Securely Upload File' : 'Upload & Generate Link'}
          </button>
        )
      )}

      {/* * Error message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}
    </div>
  )
}
