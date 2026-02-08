'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { AUTH_URL, default as apiRequest } from '@/lib/api/client'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const processedRef = useRef(false)

  useEffect(() => {
    // * Prevent double execution (React Strict Mode or fast re-renders)
    if (processedRef.current) return
    
    // * Check for direct token passing (from auth-frontend direct login)
    const token = searchParams.get('token')
    const refreshToken = searchParams.get('refresh_token')
    
    if (token && refreshToken) {
        processedRef.current = true
        const run = async () => {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                localStorage.setItem('token', token)
                localStorage.setItem('refreshToken', refreshToken)
                let userToSet = { id: payload.sub, email: payload.email || 'user@ciphera.net', display_name: payload.display_name, totp_enabled: payload.totp_enabled || false, org_id: payload.org_id, role: payload.role }
                try {
                    const fullProfile = await apiRequest<{ id: string; email: string; display_name?: string; totp_enabled: boolean; org_id?: string; role?: string }>('/auth/user/me')
                    userToSet = { ...fullProfile, org_id: payload.org_id ?? fullProfile.org_id, role: payload.role ?? fullProfile.role }
                } catch {
                    // use token user
                }
                login(token, refreshToken, userToSet)
                const returnTo = searchParams.get('returnTo') || '/dashboard'
                router.push(returnTo)
            } catch (e) {
                setError('Invalid token received')
            }
        }
        run()
        return
    }

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    
    // * Skip if params are missing (might be initial render before params are ready)
    if (!code || !state) return

    processedRef.current = true

    const storedState = localStorage.getItem('oauth_state')
    const codeVerifier = localStorage.getItem('oauth_code_verifier')

    if (!code || !state) {
      setError('Missing code or state')
      return
    }

    if (state !== storedState) {
        // * Debugging: Log state mismatch to help user diagnose
        console.error('State mismatch', { received: state, stored: storedState })
        setError('Invalid state')
        return
    }

    const exchangeCode = async () => {
      try {
        const authApiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:8081'
        const res = await fetch(`${authApiUrl}/oauth/token`, {
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
        const payload = JSON.parse(atob(data.access_token.split('.')[1]))
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('refreshToken', data.refresh_token)
        let userToSet: { id: string; email: string; display_name?: string; totp_enabled: boolean; org_id?: string; role?: string } = {
            id: payload.sub,
            email: payload.email || 'user@ciphera.net',
            display_name: payload.display_name,
            totp_enabled: payload.totp_enabled || false,
            org_id: payload.org_id,
            role: payload.role,
        }
        try {
            const fullProfile = await apiRequest<{ id: string; email: string; display_name?: string; totp_enabled: boolean; org_id?: string; role?: string }>('/auth/user/me')
            userToSet = { ...fullProfile, org_id: payload.org_id ?? fullProfile.org_id, role: payload.role ?? fullProfile.role }
        } catch {
            // use token user
        }
        login(data.access_token, data.refresh_token, userToSet)
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
                onClick={() => window.location.href = `${AUTH_URL}/login`}
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

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-800 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
