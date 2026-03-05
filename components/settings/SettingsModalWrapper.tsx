'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SettingsModal, type SettingsSection } from '@ciphera-net/ui'
import ProfileSettings from '@/components/settings/ProfileSettings'
import OrganizationSettings from '@/components/settings/OrganizationSettings'
import TrustedDevicesCard from '@/components/settings/TrustedDevicesCard'
import SecurityActivityCard from '@/components/settings/SecurityActivityCard'
import {
  UserIcon,
  LockIcon,
  ExternalLinkIcon,
  ChevronRightIcon,
  BoxIcon,
} from '@ciphera-net/ui'
import { useSettingsModal } from '@/lib/settings-modal-context'
import { useAuth } from '@/lib/auth/context'
import { updateUserPreferences } from '@/lib/api/user'

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

// --- Content Components (copied from old SettingsPageClient) ---

// Email Notification Preferences Card (file-specific toggles only)
const DROP_NOTIFICATION_OPTIONS = [
  { key: 'new_file_received', label: 'New File Received', description: 'When someone sends you a file.' },
  { key: 'file_downloaded', label: 'File Downloaded', description: 'When someone downloads your shared file.' },
]

function EmailNotificationPreferencesCard() {
  const { user } = useAuth()
  const [emailNotifications, setEmailNotifications] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (user?.preferences?.email_notifications) {
      setEmailNotifications(user.preferences.email_notifications)
    } else {
      const defaults = DROP_NOTIFICATION_OPTIONS.reduce((acc, option) => ({
        ...acc,
        [option.key]: true
      }), {} as Record<string, boolean>)
      setEmailNotifications(defaults)
    }
  }, [user])

  const handleToggle = async (key: string) => {
    const newState = {
      ...emailNotifications,
      [key]: !emailNotifications[key]
    }
    setEmailNotifications(newState)
    try {
      await updateUserPreferences({
        email_notifications: newState as { new_file_received: boolean; file_downloaded: boolean; login_alerts: boolean; password_alerts: boolean; two_factor_alerts: boolean }
      })
    } catch {
      setEmailNotifications(prev => ({
        ...prev,
        [key]: !prev[key]
      }))
    }
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-brand-orange/10">
          <BellIcon className="w-5 h-5 text-brand-orange" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Email Notifications</h2>
          <p className="text-sm text-neutral-500">Choose which email notifications you receive</p>
        </div>
      </div>

      <div className="space-y-4">
        {DROP_NOTIFICATION_OPTIONS.map((item) => (
          <div
            key={item.key}
            className={`flex items-center justify-between p-4 border rounded-xl transition-all duration-200 ${
              emailNotifications[item.key]
                ? 'bg-orange-50 dark:bg-brand-orange/10 border-brand-orange shadow-sm'
                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
            }`}
          >
            <div className="space-y-0.5">
              <span className={`block text-sm font-medium transition-colors duration-200 ${
                emailNotifications[item.key] ? 'text-brand-orange' : 'text-neutral-900 dark:text-white'
              }`}>
                {item.label}
              </span>
              <span className={`block text-xs transition-colors duration-200 ${
                emailNotifications[item.key] ? 'text-brand-orange/80' : 'text-neutral-500 dark:text-neutral-400'
              }`}>
                {item.description}
              </span>
            </div>
            <button
              onClick={() => handleToggle(item.key)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                emailNotifications[item.key] ? 'bg-brand-orange' : 'bg-neutral-200 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  emailNotifications[item.key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Security Alerts Card (granular security toggles)
const SECURITY_ALERT_OPTIONS = [
  { key: 'login_alerts', label: 'Login Activity', description: 'New device sign-ins and suspicious login attempts.' },
  { key: 'password_alerts', label: 'Password Changes', description: 'Password changes and session revocations.' },
  { key: 'two_factor_alerts', label: 'Two-Factor Authentication', description: '2FA enabled/disabled and recovery code changes.' },
]

function SecurityAlertsCard() {
  const { user } = useAuth()
  const [emailNotifications, setEmailNotifications] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (user?.preferences?.email_notifications) {
      setEmailNotifications(user.preferences.email_notifications)
    } else {
      const defaults = SECURITY_ALERT_OPTIONS.reduce((acc, option) => ({
        ...acc,
        [option.key]: true
      }), {} as Record<string, boolean>)
      setEmailNotifications(defaults)
    }
  }, [user])

  const handleToggle = async (key: string) => {
    const newState = {
      ...emailNotifications,
      [key]: !emailNotifications[key]
    }
    setEmailNotifications(newState)
    try {
      await updateUserPreferences({
        email_notifications: newState as { new_file_received: boolean; file_downloaded: boolean; login_alerts: boolean; password_alerts: boolean; two_factor_alerts: boolean }
      })
    } catch {
      setEmailNotifications(prev => ({
        ...prev,
        [key]: !prev[key]
      }))
    }
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-brand-orange/10">
          <BellIcon className="w-5 h-5 text-brand-orange" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Security Alerts</h2>
          <p className="text-sm text-neutral-500">Choose which security events trigger email alerts</p>
        </div>
      </div>

      <div className="space-y-4">
        {SECURITY_ALERT_OPTIONS.map((item) => (
          <div
            key={item.key}
            className={`flex items-center justify-between p-4 border rounded-xl transition-all duration-200 ${
              emailNotifications[item.key]
                ? 'bg-orange-50 dark:bg-brand-orange/10 border-brand-orange shadow-sm'
                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
            }`}
          >
            <div className="space-y-0.5">
              <span className={`block text-sm font-medium transition-colors duration-200 ${
                emailNotifications[item.key] ? 'text-brand-orange' : 'text-neutral-900 dark:text-white'
              }`}>
                {item.label}
              </span>
              <span className={`block text-xs transition-colors duration-200 ${
                emailNotifications[item.key] ? 'text-brand-orange/80' : 'text-neutral-500 dark:text-neutral-400'
              }`}>
                {item.description}
              </span>
            </div>
            <button
              onClick={() => handleToggle(item.key)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                emailNotifications[item.key] ? 'bg-brand-orange' : 'bg-neutral-200 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  emailNotifications[item.key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Notification Center Placeholder
function NotificationCenterPlaceholder() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
      <div className="text-center max-w-md mx-auto">
        <BellIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">Notification Center</h3>
        <p className="text-sm text-neutral-500 mb-4">
          View and manage all your notifications in one place.
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
}

// Organization Settings Card
function OrganizationSettingsCard({ activeTab }: { activeTab?: 'general' | 'members' }) {
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

  return <OrganizationSettings activeTab={activeTab} hideNav />
}

// --- Main Wrapper ---

export default function SettingsModalWrapper() {
  const { isOpen, closeSettings } = useSettingsModal()

  const sections: SettingsSection[] = [
    {
      id: 'drop',
      label: 'Drop Settings',
      description: 'Profile and sharing defaults',
      icon: UserIcon,
      defaultExpanded: true,
      items: [
        { id: 'profile', label: 'Profile', content: <ProfileSettings activeTab="profile" /> },
        { id: 'security', label: 'Security', content: <ProfileSettings activeTab="security" /> },
        { id: 'preferences', label: 'Preferences', content: <ProfileSettings activeTab="preferences" /> },
      ],
    },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Email and in-app notifications',
      icon: BellIcon,
      items: [
        { id: 'email', label: 'Email Preferences', content: <EmailNotificationPreferencesCard /> },
        { id: 'security-alerts', label: 'Security Alerts', content: <SecurityAlertsCard /> },
        { id: 'center', label: 'Notification Center', content: <NotificationCenterPlaceholder /> },
      ],
    },
    {
      id: 'organization',
      label: 'Organization',
      description: 'Team management and billing',
      icon: UsersIcon,
      items: [
        { id: 'org-general', label: 'General', content: <OrganizationSettingsCard activeTab="general" /> },
        { id: 'org-members', label: 'Members', content: <OrganizationSettingsCard activeTab="members" /> },
      ],
    },
    {
      id: 'account',
      label: 'Ciphera Account',
      description: 'Security, 2FA, and sessions',
      icon: LockIcon,
      items: [
        { id: 'auth-profile', label: 'Profile & Personal Info', href: 'https://auth.ciphera.net/settings', external: true },
        { id: 'auth-security', label: 'Security & 2FA', href: 'https://auth.ciphera.net/settings?tab=security', external: true },
        { id: 'auth-sessions', label: 'Active Sessions', href: 'https://auth.ciphera.net/settings?tab=sessions', external: true },
        { id: 'devices', label: 'Trusted Devices', content: <TrustedDevicesCard /> },
        { id: 'activity', label: 'Security Activity', content: <SecurityActivityCard /> },
      ],
    },
  ]

  return <SettingsModal open={isOpen} onClose={closeSettings} sections={sections} />
}
