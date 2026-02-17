'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import apiRequest from '@/lib/api/client'

function VerifyContent() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('Verifying your email...')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Missing verification token')
      return
    }

    const verify = async () => {
      try {
        await apiRequest(`/auth/verify?token=${token}`)
        setStatus('success')
        setMessage('Email verified successfully! You can now log in.')
      } catch (err: any) {
        setStatus('error')
        setMessage(err.message || 'Failed to verify email. The link may have expired.')
      }
    }

    verify()
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm text-center">
        <h1 className="text-2xl font-bold">Email Verification</h1>
        
        <div className={`text-lg ${status === 'error' ? 'text-red-600' : status === 'success' ? 'text-green-600' : 'text-neutral-600'}`}>
          {message}
        </div>

        {status === 'verifying' && (
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
          </div>
        )}

        {status === 'success' && (
          <Link href="/login" className="btn-primary w-full inline-flex items-center justify-center">
            Go to Login
          </Link>
        )}

        {status === 'error' && (
           <div className="text-sm text-neutral-500">
             <Link href="/signup" className="underline hover:text-neutral-800">
               Sign up again
             </Link>
             {' '}if your token expired.
           </div>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  )
}
