'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@ciphera-net/ui'
import { authFetch, AUTH_URL, getLoginUrl } from '@/lib/api/client'
import Link from 'next/link'

// We need a specific API call for the public invite info
async function getPublicInvitation(token: string) {
  const res = await fetch(`${AUTH_URL}/api/v1/invites?token=${token}`)
  if (!res.ok) {
    throw new Error('Invalid or expired invitation')
  }
  return res.json()
}

async function acceptInvitation(token: string) {
  return await authFetch('/auth/invites/accept', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

function InviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check auth
    if (typeof window !== 'undefined') {
      setIsAuthenticated(!!localStorage.getItem('token'))
    }

    if (!token) {
      setError('Missing invitation token')
      setLoading(false)
      return
    }

    getPublicInvitation(token)
      .then(data => {
        setInvite(data)
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token])

  const handleAction = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const returnPath = `/invite/accept?token=${token}`
      window.location.href = getLoginUrl(`/auth/callback?returnTo=${encodeURIComponent(returnPath)}`)
      return
    }

    setAccepting(true)
    try {
      await acceptInvitation(token!)
      toast.success('Invitation accepted!')
      router.push('/dashboard')
    } catch (err: any) {
      // If 401, they need to login.
      if (err.status === 401) {
         const returnPath = `/invite/accept?token=${token}`
         window.location.href = getLoginUrl(`/auth/callback?returnTo=${encodeURIComponent(returnPath)}`)
      } else {
         toast.error(err.message || 'Failed to accept invitation')
      }
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-lg shadow p-8 text-center border border-red-100 dark:border-red-900/20">
          <h1 className="text-xl font-bold text-red-600 mb-4">Invitation Error</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">{error}</p>
          <Link href="/">
            <Button variant="secondary">Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8 text-center">
        <div className="mx-auto h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
          <span className="text-2xl">👋</span>
        </div>
        
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          Join {invite.organization_name}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          You have been invited to join this workspace on Ciphera.
        </p>

        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4 mb-8 text-left">
          <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Email</div>
          <div className="font-medium text-neutral-900 dark:text-white">{invite.email}</div>
          <div className="mt-3 text-sm text-neutral-500 dark:text-neutral-400 mb-1">Role</div>
          <div className="font-medium text-neutral-900 dark:text-white capitalize">{invite.role}</div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleAction} 
            disabled={accepting}
            isLoading={accepting}
            className="w-full py-3 text-lg"
          >
            {isAuthenticated ? 'Accept Invitation' : 'Sign in to Accept'}
          </Button>
          
          <p className="text-xs text-neutral-500 mt-4">
            By accepting, you agree to become a member of this organization.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InviteContent />
    </Suspense>
  )
}
