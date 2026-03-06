'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  SettingsModal,
  type SettingsSection,
  NotificationToggleList,
  type NotificationOption,
  UserIcon,
  LockIcon,
  BellIcon,
  UsersIcon,
  ChevronRightIcon,
} from '@ciphera-net/ui'
import ProfileSettings from '@/components/settings/ProfileSettings'
import OrganizationSettings from '@/components/settings/OrganizationSettings'
import TrustedDevicesCard from '@/components/settings/TrustedDevicesCard'
import SecurityActivityCard from '@/components/settings/SecurityActivityCard'
import { useSettingsModal } from '@/lib/settings-modal-context'
import { useAuth } from '@/lib/auth/context'
import { updateUserPreferences } from '@/lib/api/user'

// --- Notification option definitions ---

const DROP_NOTIFICATION_OPTIONS: NotificationOption[] = [
  { key: 'new_file_received', label: 'New File Received', description: 'When someone sends you a file.' },
  { key: 'file_downloaded', label: 'File Downloaded', description: 'When someone downloads your shared file.' },
]

const SECURITY_ALERT_OPTIONS: NotificationOption[] = [
  { key: 'login_alerts', label: 'Login Activity', description: 'New device sign-ins and suspicious login attempts.' },
  { key: 'password_alerts', label: 'Password Changes', description: 'Password changes and session revocations.' },
  { key: 'two_factor_alerts', label: 'Two-Factor Authentication', description: '2FA enabled/disabled and recovery code changes.' },
]

// --- Content Components ---

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
    <NotificationToggleList
      title="Email Notifications"
      description="Choose which email notifications you receive"
      icon={<BellIcon className="w-5 h-5 text-brand-orange" />}
      options={DROP_NOTIFICATION_OPTIONS}
      values={emailNotifications}
      onToggle={handleToggle}
    />
  )
}

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
    <NotificationToggleList
      title="Security Alerts"
      description="Choose which security events trigger email alerts"
      icon={<BellIcon className="w-5 h-5 text-brand-orange" />}
      options={SECURITY_ALERT_OPTIONS}
      values={emailNotifications}
      onToggle={handleToggle}
    />
  )
}

function NotificationCenterPlaceholder() {
  return (
    <div className="text-center max-w-md mx-auto py-8">
      <BellIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">Notification Center</h3>
      <p className="text-sm text-neutral-500 mb-4">View and manage all your notifications in one place.</p>
      <Link href="/notifications" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-brand-orange/90 transition-colors">
        Open Notification Center
        <ChevronRightIcon className="w-4 h-4" />
      </Link>
    </div>
  )
}

function OrganizationSettingsCard({ activeTab }: { activeTab?: 'general' | 'members' }) {
  const { user } = useAuth()
  const orgId = user?.org_id

  if (!orgId) {
    return (
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <UsersIcon className="w-5 h-5 text-neutral-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Organization Settings</h2>
          <p className="text-sm text-neutral-500">Manage your team and billing</p>
        </div>
        <p className="text-sm text-neutral-500 w-full mt-2">
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
      label: 'Account',
      icon: UserIcon,
      defaultExpanded: true,
      items: [
        { id: 'profile', label: 'Profile', content: <ProfileSettings activeTab="profile" borderless hideDangerZone /> },
        { id: 'security', label: 'Security', content: <ProfileSettings activeTab="security" borderless /> },
        { id: 'preferences', label: 'Preferences', content: <ProfileSettings activeTab="preferences" borderless /> },
        { id: 'danger-zone', label: 'Danger Zone', content: <ProfileSettings activeTab="danger-zone" borderless /> },
      ],
    },
    {
      id: 'security',
      label: 'Security',
      icon: LockIcon,
      items: [
        { id: 'devices', label: 'Trusted Devices', content: <TrustedDevicesCard /> },
        { id: 'activity', label: 'Security Activity', content: <SecurityActivityCard /> },
      ],
    },
    {
      id: 'notifications',
      label: 'Notifications',
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
      icon: UsersIcon,
      items: [
        { id: 'org-general', label: 'General', content: <OrganizationSettingsCard activeTab="general" /> },
        { id: 'org-members', label: 'Members', content: <OrganizationSettingsCard activeTab="members" /> },
      ],
    },
  ]

  return <SettingsModal open={isOpen} onClose={closeSettings} sections={sections} />
}
