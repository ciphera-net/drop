'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExitIcon, PersonIcon, GearIcon, DashboardIcon, ChevronDownIcon, CubeIcon } from '@radix-ui/react-icons'
import LoadingOverlay from './LoadingOverlay'
import { initiateOAuthFlow, initiateSignupFlow } from '@/lib/api/oauth'

// * Import Workspace Switcher
import WorkspaceSwitcher from './WorkspaceSwitcher'

function OrgSettingsLink({ setIsOpen }: { setIsOpen: (open: boolean) => void }) {
  const [isOrg, setIsOrg] = useState(false)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token')
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                if (payload.org_id) {
                    setIsOrg(true)
                }
            } catch (e) {}
        }
    }
  }, [])

  if (!isOrg) return null

  return (
    <Link
      href="/org-settings"
      onClick={() => setIsOpen(false)}
      className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      <CubeIcon className="h-4 w-4 text-neutral-500 group-hover:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-white" />
      Organization Settings
    </Link>
  )
}

export default function UserMenu() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (loading && !user) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />
    )
  }

  if (user) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white p-1 pl-2 pr-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            <PersonIcon className="h-4 w-4" />
          </div>
          <span className="hidden sm:block max-w-[100px] truncate">{user.email?.split('@')[0]}</span>
          <ChevronDownIcon className={`h-4 w-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="absolute right-0 top-full mt-2 w-64 origin-top-right divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white shadow-xl ring-1 ring-black/5 focus:outline-none dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden"
            >
              <div className="px-1 py-1">
                <div className="px-3 py-2 text-xs text-neutral-500 dark:text-neutral-400">
                  Signed in as <br />
                  <span className="font-medium text-neutral-900 dark:text-white truncate block">{user.email}</span>
                </div>
              </div>
              
              <div className="px-1 py-1">
                <WorkspaceSwitcher />
              </div>

              <div className="px-1 py-1">
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <DashboardIcon className="h-4 w-4 text-neutral-500 group-hover:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-white" />
                  Dashboard
                </Link>
                {/* Check if in org context via helper or just conditional rendering if easy */}
                {/* Since we don't have isOrgContext state here easily without parsing token, let's try to infer it from auth context or let UserMenu check it */}
                <OrgSettingsLink setIsOpen={setIsOpen} />
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <GearIcon className="h-4 w-4 text-neutral-500 group-hover:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-white" />
                  Settings
                </Link>
              </div>

              <div className="px-1 py-1">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    logout()
                  }}
                  className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <ExitIcon className="h-4 w-4 opacity-70" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => initiateOAuthFlow()}
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900 px-4 py-2 rounded-xl hover:bg-neutral-100/50 transition-all duration-200 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/50"
        >
          Sign in
        </button>
        <button
          onClick={() => initiateSignupFlow()}
          className="btn-primary text-sm px-5 py-2.5"
        >
          Sign up
        </button>
      </div>
    </>
  )
}
