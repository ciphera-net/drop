'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button, Input } from '@ciphera-net/ui'
import PasswordInput from '@/components/PasswordInput'
import apiRequest from '@/lib/api/client'
import { deriveAuthKey } from '@/lib/crypto/password'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // * Derive auth key from password so raw password never leaves client
      const derivedPassword = await deriveAuthKey(password, email)
      
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password: derivedPassword }),
      })

      setSuccess(true)
    } catch (err: any) {
      const msg = err.message || 'Failed to create account'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Check your email</h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            We've sent a verification link to <span className="font-medium text-neutral-900 dark:text-white">{email}</span>.
            Please verify your email to continue.
          </p>
          <div className="pt-4">
             <Link href="/login" className="text-sm font-medium text-neutral-900 dark:text-white hover:underline">
               Return to Login
             </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Create Ciphera ID</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            One account for all Ciphera services
          </p>
        </div>

        <form onSubmit={handleSignup} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-500 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
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
              />
            </div>

            <div>
              <PasswordInput
                id="password"
                required
                minLength={8}
                value={password}
                onChange={setPassword}
                placeholder="Minimum 8 characters"
                label="Password"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            isLoading={loading}
            className="w-full rounded-xl py-3"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-neutral-600 dark:text-neutral-400">
            Already have an account?{' '}
          </span>
          <Link
            href="/login"
            className="font-medium text-neutral-900 dark:text-white hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
