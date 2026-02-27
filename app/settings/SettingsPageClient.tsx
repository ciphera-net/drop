'use client'

/**
 * Unified Settings Experience for Drop
 * Clear separation between App Settings and Account Settings
 */

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/context'
import ProfileSettings from '@/components/settings/ProfileSettings'
import OrganizationSettings from '@/components/settings/OrganizationSettings'
import {
  UserIcon,
  LockIcon,
  BoxIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  AlertTriangleIcon,
} from '@ciphera-net/ui'

// Inline SVG icons not available in ciphera-ui
function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

type SettingsTab = 'profile' | 'notifications' | 'organization' | 'account'

// Navigation item component
function NavItem({
  active,
  onClick,
  icon: Icon,
  label,
  description,
  external = false,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
  description?: string
  external?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 ${
        active
          ? 'bg-brand-orange/10 text-brand-orange ring-1 ring-brand-orange/20'
          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
      }`}
    >
      <Icon className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{label}</span>
          {external && <ExternalLinkIcon className="w-3.5 h-3.5 opacity-60" />}
        </div>
        {description && (
          <p className={`text-xs mt-0.5 ${active ? 'text-brand-orange/70' : 'text-neutral-500'}`}>
            {description}
          </p>
        )}
      </div>
      <ChevronRightIcon className={`w-4 h-4 shrink-0 transition-transform ${active ? 'rotate-90' : ''}`} />
    </button>
  )
}

// Account Management Card - Links to Auth
function AccountManagementCard() {
  const accountLinks = [
    {
      label: 'Profile & Personal Info',
      description: 'Update your name, email, and avatar',
      href: 'https://auth.ciphera.net/settings',
      icon: UserIcon,
    },
    {
      label: 'Security & 2FA',
      description: 'Password, two-factor authentication, and passkeys',
      href: 'https://auth.ciphera.net/settings?tab=security',
      icon: LockIcon,
    },
    {
      label: 'Active Sessions',
      description: 'Manage devices logged into your account',
      href: 'https://auth.ciphera.net/settings?tab=sessions',
      icon: BoxIcon,
    },
  ]

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-brand-orange/10">
          <UserIcon className="w-5 h-5 text-brand-orange" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Ciphera Account</h2>
          <p className="text-sm text-neutral-500">Manage your account across all Ciphera products</p>
        </div>
      </div>

      <div className="space-y-3">
        {accountLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-brand-orange/30 hover:bg-brand-orange/5 transition-all group"
          >
            <link.icon className="w-5 h-5 text-neutral-400 group-hover:text-brand-orange shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900 dark:text-white group-hover:text-brand-orange">
                  {link.label}
                </span>
                <ExternalLinkIcon className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <p className="text-sm text-neutral-500 mt-0.5">{link.description}</p>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-neutral-400 shrink-0 mt-1" />
          </a>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <p className="text-xs text-neutral-500">
          These settings apply to your Ciphera Account and affect all products (Drop, Pulse, and Auth).
        </p>
      </div>
    </div>
  )
}

// Organization Settings Card
function OrganizationSettingsCard() {
  const { user } = useAuth()
  const orgId = user?.org_id

  if (!orgId) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
            <UsersIcon className="w-5 h-5 text-neutral-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Organization Settings</h2>
            <p className="text-sm text-neutral-500">Manage your team and billing</p>
          </div>
        </div>
        <p className="text-sm text-neutral-500">
          You are currently in your personal workspace.{' '}
          <Link href="/dashboard/organizations/new" className="text-brand-orange hover:underline">
            Create an organization
          </Link>{' '}
          to access team features.
        </p>
      </div>
    )
  }

  // Render the full OrganizationSettings component when in org context
  return <OrganizationSettings />
}

// App Settings Section
function AppSettingsSection() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Please sign in to access settings.</p>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-orange/10">
                  <UserIcon className="w-5 h-5 text-brand-orange" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Profile & Preferences</h2>
                  <p className="text-sm text-neutral-500">Manage your profile and default sharing settings</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ProfileSettings />
            </div>
          </div>
        )
      case 'notifications':
        return (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
            <div className="text-center max-w-md mx-auto">
              <BellIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">Notification Preferences</h3>
              <p className="text-sm text-neutral-500 mb-4">
                Configure which notifications you receive and how you want to be notified.
              </p>
              <Link
                href="/notifications"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-brand-orange/90 transition-colors"
              >
                Open Notification Center
                <ChevronRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )
      case 'organization':
        return <OrganizationSettingsCard />
      case 'account':
        return <AccountManagementCard />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Navigation */}
      <nav className="w-full lg:w-72 flex-shrink-0 space-y-6">
        {/* App Settings Section */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 px-4">
            Drop Settings
          </h3>
          <div className="space-y-1">
            <NavItem
              active={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
              icon={UserIcon}
              label="Profile & Preferences"
              description="Your profile and sharing defaults"
            />
            <NavItem
              active={activeTab === 'notifications'}
              onClick={() => setActiveTab('notifications')}
              icon={BellIcon}
              label="Notifications"
              description="Email and in-app notifications"
            />
            <NavItem
              active={activeTab === 'organization'}
              onClick={() => setActiveTab('organization')}
              icon={UsersIcon}
              label="Organization"
              description="Team management and billing"
            />
          </div>
        </div>

        {/* Account Section */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 px-4">
            Ciphera Account
          </h3>
          <NavItem
            active={activeTab === 'account'}
            onClick={() => setActiveTab('account')}
            icon={LockIcon}
            label="Manage Account"
            description="Security, 2FA, and sessions"
            external
          />
        </div>
      </nav>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        {renderContent()}
      </div>
    </div>
  )
}

export default function SettingsPageClient() {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Manage your Drop preferences and Ciphera account settings
        </p>
      </div>

      {/* Breadcrumb / Context */}
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <span>You are signed in as</span>
        <span className="font-medium text-neutral-900 dark:text-white">{user?.email}</span>
        <span>•</span>
        <a
          href="https://auth.ciphera.net/settings"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-orange hover:underline inline-flex items-center gap-1"
        >
          Manage in Ciphera Account
          <ExternalLinkIcon className="w-3 h-3" />
        </a>
      </div>

      {/* Settings Content */}
      <AppSettingsSection />
    </div>
  )
}
