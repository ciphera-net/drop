'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'

export default function UserMenu() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-9 w-16 animate-pulse rounded-xl bg-neutral-100" />
        <div className="h-9 w-20 animate-pulse rounded-xl bg-neutral-100" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={logout}
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900 px-4 py-2 rounded-xl hover:bg-neutral-100/50 transition-all duration-200"
        >
          Sign Out
        </button>
        <Link 
          href="/dashboard"
          className="btn-primary text-sm px-5 py-2.5"
        >
          Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="text-sm font-medium text-neutral-600 hover:text-neutral-900 px-4 py-2 rounded-xl hover:bg-neutral-100/50 transition-all duration-200"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="btn-primary text-sm px-5 py-2.5"
      >
        Sign up
      </Link>
    </div>
  )
}
