'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, PersonIcon, CubeIcon, CheckIcon } from '@radix-ui/react-icons'
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
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)

  useEffect(() => {
    // Parse token to get active org ID
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token')
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                setActiveOrgId(payload.org_id || null)
            } catch (e) {
                console.error('Failed to parse token for workspace state', e)
            }
        }
    }

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
    console.log('Switching to workspace:', orgId)
    setSwitching(orgId || 'personal')
    try {
      const { access_token } = await switchContext(orgId)
      console.log('Received new token:', access_token)
      
      localStorage.setItem('access_token', access_token) // Note: Client uses 'token', verify this
      // * Correction: api/client.ts uses 'token', not 'access_token'
      localStorage.setItem('token', access_token)
      // * Save active org ID for refresh logic
      if (orgId) {
          console.log('Setting active_org_id:', orgId)
          localStorage.setItem('active_org_id', orgId)
      } else {
          console.log('Clearing active_org_id')
          localStorage.removeItem('active_org_id')
      }
      
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
        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors group ${
            !activeOrgId ? 'bg-neutral-100 dark:bg-neutral-800' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
            <PersonIcon className="h-3 w-3 text-neutral-500 dark:text-neutral-400" />
          </div>
          <span className="text-neutral-700 dark:text-neutral-300">Personal</span>
        </div>
        <div className="flex items-center gap-2">
            {switching === 'personal' && <span className="text-xs text-neutral-400">Loading...</span>}
            {!activeOrgId && !switching && <CheckIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />}
        </div>
      </button>

      {/* Organization Workspaces */}
      {orgs.map((org) => (
        <button
          key={org.organization_id}
          onClick={() => handleSwitch(org.organization_id)}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors mt-1 ${
            activeOrgId === org.organization_id ? 'bg-neutral-100 dark:bg-neutral-800' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <CubeIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-neutral-700 dark:text-neutral-300 truncate max-w-[140px]">
              {org.organization_name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {switching === org.organization_id && <span className="text-xs text-neutral-400">Loading...</span>}
            {activeOrgId === org.organization_id && !switching && <CheckIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />}
          </div>
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
        <span>Create Organization</span>
      </Link>
    </div>
  )
}
