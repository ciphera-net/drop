'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'

export default function UserMenu() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  if (loading) {
    return <div className="h-8 w-20 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard"
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        >
          Dashboard
        </Link>
        <button
          onClick={logout}
          className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
      >
        Sign up
      </Link>
    </div>
  )
}
