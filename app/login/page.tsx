'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button, Input } from '@ciphera-net/ui'
import PasswordInput from '@/components/PasswordInput'
import { deriveAuthKey } from '@/lib/crypto/password'
import { useAuth } from '@/lib/auth/context'
import { AUTH_URL } from '@/lib/api/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // * 2FA State
  const [show2FA, setShow2FA] = useState(false)
  const [totpCode, setTotpCode] = useState('')

  const router = useRouter()
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // * Derive auth key from password so raw password never leaves client
      const derivedPassword = await deriveAuthKey(password, email)
      
      const body: any = { 
        email, 
        password: derivedPassword 
      }

      if (show2FA) {
        body.totp_code = totpCode
      }

      const res = await fetch(`${AUTH_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        // * Check for 2FA requirement
        if (res.status === 401 && data.require_2fa) {
          setShow2FA(true)
          setLoading(false)
          toast.message('Two-factor authentication required', {
             description: 'Please enter the code from your authenticator app.'
          })
          return
        }

        // * Check for Captcha requirement (not implemented in UI yet, but API might return it)
        if (data.require_captcha) {
           setError('Security check required. Please try again later or contact support.') // Placeholder
           return
        }

        throw new Error(data.error || 'Failed to sign in')
      }

      // * Success
      login(data.token, data.refresh_token, {
        id: data.user.id,
        email: data.user.email,
        totp_enabled: data.user.totp_enabled
      })

      toast.success('Welcome back!')
      router.push('/dashboard')

    } catch (err: any) {
      console.error('Login failed', err)
      const msg = err.message || 'Failed to sign in'
      setError(msg)
      toast.error(msg)
    } finally {
      if (!show2FA) { // Don't stop loading if we are just switching to 2FA view? Actually we should stop to let user type.
         setLoading(false)
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Sign in to continue to Drop
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-500 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {!show2FA ? (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-900 dark:text-neutral-200 mb-1">
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-sm font-medium text-neutral-900 dark:text-neutral-200">
                      Password
                    </label>
                    <Link 
                      href="/request/password-reset" 
                      className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <PasswordInput
                    id="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    label=""
                    autoComplete="current-password"
                  />
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="totp" className="block text-sm font-medium text-neutral-900 dark:text-neutral-200 mb-1">
                  Authentication or Recovery Code
                </label>
                <Input
                  id="totp"
                  type="text"
                  required
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="Code"
                  maxLength={20}
                  autoComplete="one-time-code"
                  className="text-center tracking-widest text-lg"
                  autoFocus
                />
                <p className="mt-2 text-xs text-neutral-500 text-center">
                  Open your authenticator app or enter a recovery code.
                </p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            isLoading={loading}
            className="w-full rounded-xl py-3"
          >
            {loading ? (show2FA ? 'Verifying...' : 'Signing in...') : (show2FA ? 'Verify Code' : 'Sign in')}
          </Button>
          
          {show2FA && (
             <Button
                type="button"
                variant="ghost"
                onClick={() => setShow2FA(false)}
                className="w-full mt-2"
                disabled={loading}
             >
                Cancel
             </Button>
          )}
        </form>

        <div className="text-center text-sm">
          <span className="text-neutral-600 dark:text-neutral-400">
            Don&apos;t have an account?{' '}
          </span>
          <Link
            href="/signup"
            className="font-medium text-neutral-900 dark:text-white hover:underline"
          >
            Create Ciphera ID
          </Link>
        </div>
      </div>
    </div>
  )
}
