'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { generatePKCE, generateRandomString } from '@/lib/crypto/pkce'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      // * Artificial delay for better UX (prevents instant flicker)
      await new Promise((resolve) => setTimeout(resolve, 800))

      // * Generate PKCE challenge
      const { verifier, challenge } = await generatePKCE()
      const state = generateRandomString(16)

      // * Store verifier and state for verification on callback
      localStorage.setItem('oauth_code_verifier', verifier)
      localStorage.setItem('oauth_state', state)

      // * Build authorization URL
      const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:8081'
      const clientId = 'drop-app'
      const redirectUri = window.location.origin + '/auth/callback'
      
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        state: state,
        code_challenge: challenge,
        code_challenge_method: 'S256'
      })

      // * Redirect to Ciphera Auth
      window.location.href = `${authUrl}/oauth/authorize?${params.toString()}`
    } catch (err) {
      console.error('Failed to initialize login', err)
      toast.error('Failed to initialize login')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Sign in to continue to Drop
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              'Redirecting...'
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Login with Ciphera ID
              </>
            )}
          </button>
        </div>

        <div className="text-center text-sm">
          <span className="text-neutral-600">
            Don&apos;t have an account?{' '}
          </span>
          <Link
            href="/signup"
            className="font-medium text-neutral-900 hover:underline"
          >
            Create Ciphera ID
          </Link>
        </div>
      </div>
    </div>
  )
}
