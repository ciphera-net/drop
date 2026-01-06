'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const storedState = localStorage.getItem('oauth_state')
    const codeVerifier = localStorage.getItem('oauth_code_verifier')

    if (!code || !state) {
      setError('Missing code or state')
      return
    }

    if (state !== storedState) {
      setError('Invalid state')
      return
    }

    const exchangeCode = async () => {
      try {
        const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:8081'
        const res = await fetch(`${authUrl}/api/v1/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            code,
            client_id: 'drop-app',
            redirect_uri: window.location.origin + '/auth/callback',
            code_verifier: codeVerifier,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to exchange token')
        }

        const data = await res.json()
        
        // * In a real app, we would fetch user profile here.
        // * But our token contains 'sub' (id) and (we added) 'email'.
        // * However, the token is signed and we can't easily read claims on client without a library.
        // * For now, we will assume the token is valid and just decode it manually to get email/id 
        // * OR since we control the response of /oauth/token, we can just return user info there too?
        // * No, standard OAuth doesn't return user info in token response usually.
        // * Let's just decode the token payload (it's base64).
        
        const payload = JSON.parse(atob(data.access_token.split('.')[1]))
        
        login(data.access_token, {
            id: payload.sub,
            email: payload.email || 'user@ciphera.net' // Fallback if email claim missing
        })
        
        // * Cleanup
        localStorage.removeItem('oauth_state')
        localStorage.removeItem('oauth_code_verifier')
        
        router.push('/dashboard')
      } catch (err: any) {
        setError(err.message)
      }
    }

    exchangeCode()
  }, [searchParams, login, router])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="rounded-md bg-red-50 p-4 text-red-500">
          Error: {error}
          <div className="mt-4">
            <button 
                onClick={() => router.push('/login')}
                className="text-sm underline"
            >
                Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-800 mx-auto mb-4"></div>
        <p className="text-neutral-600">Completing sign in...</p>
      </div>
    </div>
  )
}
