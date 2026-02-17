'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import FileUpload from '../../../components/FileUpload'
import apiRequest from '../../../lib/api/client'
import { FileRequest } from '../../../lib/types/api'
import { decodeKeyFromSharing, importEncryptionKey } from '../../../lib/crypto/key-management'
import { decryptString, base64ToArrayBuffer } from '../../../lib/crypto/encryption'
import Link from 'next/link'
import { Button } from '@ciphera-net/ui'

export default function RequestPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.shareId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestDetails, setRequestDetails] = useState<FileRequest | null>(null)
  const [requestKey, setRequestKey] = useState<Uint8Array | undefined>(undefined)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // * 1. Get Key from URL Hash
    const hash = window.location.hash.slice(1) // Remove '#'
    if (!hash) {
      setError('Invalid request link. Missing encryption key.')
      setLoading(false)
      return
    }

    try {
      const key = decodeKeyFromSharing(hash)
      setRequestKey(key)
    } catch (e) {
      setError('Invalid encryption key in link.')
      setLoading(false)
      return
    }

    // * 2. Fetch Request Details
    const fetchRequest = async () => {
      try {
        const data = await apiRequest<FileRequest>(`/requests/${requestId}`)
        
        // * Decrypt Metadata if key is available
        if (requestKey && data.encryptedTitle && data.iv) {
           try {
             const cryptoKey = await importEncryptionKey(requestKey)
             const ivArr = new Uint8Array(base64ToArrayBuffer(data.iv))
             
             const decryptedTitle = await decryptString(
                 base64ToArrayBuffer(data.encryptedTitle),
                 cryptoKey,
                 ivArr
             )
             
             let decryptedDesc = ''
             if (data.encryptedDescription) {
                 decryptedDesc = await decryptString(
                     base64ToArrayBuffer(data.encryptedDescription),
                     cryptoKey,
                     ivArr
                 )
             }
             
             setRequestDetails({
                 ...data,
                 title: decryptedTitle,
                 description: decryptedDesc
             })
           } catch (e) {
             console.error('Failed to decrypt metadata:', e)
             // Fallback to showing generic or encrypted data? 
             // Better to leave title undefined so "Send Files Securely" fallback works
             setRequestDetails(data) 
           }
        } else {
            setRequestDetails(data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Request not found or expired')
      } finally {
        setLoading(false)
      }
    }

    if (requestId) {
      fetchRequest()
    }
  }, [requestId, requestKey]) // Added requestKey dependency

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
          <p className="text-neutral-500">Loading request...</p>
        </div>
      </div>
    )
  }

  if (error || !requestDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Unable to Load Request</h1>
          <p className="text-neutral-600">{error || 'This request link is invalid or has expired.'}</p>
          <Link href="/" className="btn-secondary inline-block">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 pt-12 pb-32 relative overflow-hidden bg-white">
      <div className="max-w-2xl w-full space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-4">
            {requestDetails.title || 'Send Files Securely'}
          </h1>
          {requestDetails.description && (
            <p className="text-lg text-neutral-600 max-w-md mx-auto leading-relaxed">
              {requestDetails.description}
            </p>
          )}
          <div className="mt-4 text-sm text-neutral-400">
            Requested by User • End-to-End Encrypted
          </div>
        </div>

        {/* Upload Card */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-brand-orange/5 border border-neutral-100/50 backdrop-blur-sm max-w-md mx-auto aspect-square flex flex-col justify-center">
          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-neutral-900">File Uploaded!</h3>
              <p className="text-neutral-600">
                Your file has been securely encrypted and sent.
              </p>
              <Button
                onClick={() => setSuccess(false)}
                variant="secondary"
                className="mt-4 w-full"
              >
                Send Another File
              </Button>
            </div>
          ) : (
            <FileUpload 
              requestId={requestId} 
              requestKey={requestKey}
              onUploadComplete={() => setSuccess(true)}
            />
          )}
        </div>
      </div>
    </main>
  )
}
