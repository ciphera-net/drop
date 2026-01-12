'use client'

import ProfileSettings from '@/components/settings/ProfileSettings'
import OrganizationSettings from '@/components/settings/OrganizationSettings'
import { useEffect, useState } from 'react'
import { PersonIcon, CubeIcon } from '@radix-ui/react-icons'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'organization'>('profile')
  const [isOrgContext, setIsOrgContext] = useState(false)

  useEffect(() => {
    // Check if we are in an org context
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token')
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                if (payload.org_id) {
                    setIsOrgContext(true)
                    // Default to org settings if in org context? 
                    // Or let user choose? Let's just enable the tab.
                }
            } catch (e) {}
        }
    }
  }, [])

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">Settings</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2">Manage your account and preferences.</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
            }`}
          >
            <PersonIcon className="w-4 h-4" />
            Profile
          </button>
          
          {isOrgContext && (
            <button
                onClick={() => setActiveTab('organization')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'organization'
                    ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                }`}
            >
                <CubeIcon className="w-4 h-4" />
                Organization
            </button>
          )}
        </div>

        {/* Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'profile' ? <ProfileSettings /> : <OrganizationSettings />}
        </div>
      </div>
    </div>
  )
}
