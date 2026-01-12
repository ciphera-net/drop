'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, PersonIcon, CubeIcon } from '@radix-ui/react-icons'
import { getUserOrganizations, switchContext, OrganizationMember } from '@/lib/api/organization'
import { useAuth } from '@/lib/auth/context'
import Link from 'next/link'

export default function WorkspaceSwitcher() {
  const auth = useAuth()
  // * Defensive: fallback to refresh if refreshSession is missing (e.g. during migration/caching)
  const refreshSession = auth.refreshSession || auth.refresh 
  const { user } = auth
  
  const router = useRouter()
  const [orgs, setOrgs] = useState<OrganizationMember[]>([])
  const [switching, setSwitching] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      getUserOrganizations()
        .then(data => {
            console.log('Fetched organizations:', data)
            setOrgs(data)
        })
        .catch(err => console.error('Failed to fetch orgs:', err))
    }
  }, [user])

  const handleSwitch = async (orgId: string | null) => {
    setSwitching(orgId || 'personal')
    try {
      const { access_token } = await switchContext(orgId)
      
      localStorage.setItem('access_token', access_token) // Note: Client uses 'token', verify this
      // * Correction: api/client.ts uses 'token', not 'access_token'
      localStorage.setItem('token', access_token) 
      
      // Force reload to pick up new permissions
      window.location.reload() 
      
    } catch (err) {
      console.error('Failed to switch workspace', err)
      setSwitching(null)
    }
  }

  return (
    <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-2">
      <div className="px-3 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
        Workspaces
      </div>
      
      {/* Personal Workspace */}
      <button
        onClick={() => handleSwitch(null)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
            <PersonIcon className="h-3 w-3 text-neutral-500 dark:text-neutral-400" />
          </div>
          <span className="text-neutral-700 dark:text-neutral-300">Personal</span>
        </div>
        {switching === 'personal' && <span className="text-xs text-neutral-400">Loading...</span>}
      </button>

      {/* Organization Workspaces */}
      {orgs.map((org) => (
        <button
          key={org.organization_id}
          onClick={() => handleSwitch(org.organization_id)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <CubeIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-neutral-700 dark:text-neutral-300 truncate max-w-[140px]">
              {org.organization_name}
            </span>
          </div>
          {switching === org.organization_id && <span className="text-xs text-neutral-400">Loading...</span>}
        </button>
      ))}

      {/* Create New */}
      <Link
        href="/dashboard/organizations/new"
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-md transition-colors mt-1"
      >
        <div className="h-5 w-5 rounded border border-dashed border-neutral-300 dark:border-neutral-600 flex items-center justify-center">
          <PlusIcon className="h-3 w-3" />
        </div>
        <span>Create Team</span>
      </Link>
    </div>
  )
}
