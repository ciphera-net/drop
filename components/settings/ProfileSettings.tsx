'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { ProfileSettings as SharedProfileSettings } from '@ciphera-net/ui'
import api from '@/lib/api/client'
import { deriveAuthKey } from '@/lib/crypto/password'
import { deleteAccount, deleteAllUserFiles, getUserSessions, revokeSession, updateUserPreferences } from '@/lib/api/user'
import { setup2FA, verify2FA, disable2FA, regenerateRecoveryCodes } from '@/lib/api/2fa'
import { LockIcon } from '@ciphera-net/ui'

interface ShareDefaults {
  expiration: string
  downloadLimit: string
  autoPassword: boolean
}

const DEFAULT_SHARE_SETTINGS: ShareDefaults = {
  expiration: '24h',
  downloadLimit: '10',
  autoPassword: false
}

const EXPIRATION_OPTIONS = [
  { label: '1 Hour', value: '1h' },
  { label: '24 Hours', value: '24h' },
  { label: '7 Days', value: '7d' },
]

const DOWNLOAD_LIMITS = [
  { label: '1', value: '1' },
  { label: '10', value: '10' },
  { label: '100', value: '100' },
  { label: '∞', value: 'unlimited' },
]

const NOTIFICATION_OPTIONS = [
  { key: 'new_file_received', label: 'New File Received', description: 'When someone sends you a file.' },
  { key: 'file_downloaded', label: 'File Downloaded', description: 'When someone downloads your shared file.' },
  { key: 'security_alerts', label: 'Security Alerts', description: 'Important security events like new logins.' },
]

export default function ProfileSettings() {
  const { user, refresh, logout } = useAuth()
  
  // Preferences State
  const [shareDefaults, setShareDefaults] = useState<ShareDefaults>(DEFAULT_SHARE_SETTINGS)
  const [defaultsLoaded, setDefaultsLoaded] = useState(false)

  // Load defaults on mount
  useEffect(() => {
    const saved = localStorage.getItem('drop_share_defaults')
    if (saved) {
      try {
        setShareDefaults({ ...DEFAULT_SHARE_SETTINGS, ...JSON.parse(saved) })
      } catch (e) {
        console.error('Failed to parse share defaults', e)
      }
    }
    setDefaultsLoaded(true)
  }, [])

  // Save defaults when changed
  useEffect(() => {
    if (defaultsLoaded) {
      localStorage.setItem('drop_share_defaults', JSON.stringify(shareDefaults))
    }
  }, [shareDefaults, defaultsLoaded])

  if (!user) return null

  const handleUpdateProfile = async (email: string, currentPasswordDerived: string, newDerivedKey: string) => {
    await api('/auth/user/email', {
      method: 'PUT',
      body: JSON.stringify({
        email: email,
        current_password: currentPasswordDerived,
        new_derived_key: newDerivedKey
      })
    })
  }

  const handleUpdatePassword = async (currentPasswordDerived: string, newDerivedKey: string) => {
    await api('/auth/user/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: currentPasswordDerived,
        new_password: newDerivedKey
      })
    })
  }

  const renderPreferences = (
    <div>
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">Default Share Settings</h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">Set your preferred defaults for new drops. (These are saved locally)</p>

      <div className="mt-4 space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Default Expiration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EXPIRATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setShareDefaults(prev => ({ ...prev, expiration: option.value }))}
                  className={`px-3 py-2 text-sm font-medium rounded-xl border transition-all duration-200 ${
                    shareDefaults.expiration === option.value
                      ? 'bg-brand-orange text-white border-brand-orange shadow-md shadow-brand-orange/20'
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-brand-orange/50 hover:bg-brand-orange/5 dark:hover:bg-brand-orange/10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Default Download Limit
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DOWNLOAD_LIMITS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setShareDefaults(prev => ({ ...prev, downloadLimit: option.value }))}
                  className={`px-3 py-2 text-sm font-medium rounded-xl border transition-all duration-200 ${
                    shareDefaults.downloadLimit === option.value
                      ? 'bg-brand-orange text-white border-brand-orange shadow-md shadow-brand-orange/20'
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-brand-orange/50 hover:bg-brand-orange/5 dark:hover:bg-brand-orange/10'
                  }`}
                >
                  {option.label === '∞' ? <span className="text-xl leading-none block">∞</span> : option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`flex items-center justify-between p-4 border rounded-xl transition-all duration-200 ${
          shareDefaults.autoPassword 
            ? 'bg-orange-50 dark:bg-brand-orange/10 border-brand-orange shadow-sm' 
            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors duration-200 ${
              shareDefaults.autoPassword ? 'bg-brand-orange text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
            }`}>
              <LockIcon className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className={`block text-sm font-medium transition-colors duration-200 ${
                shareDefaults.autoPassword ? 'text-brand-orange' : 'text-neutral-900 dark:text-white'
              }`}>
                Auto-generate password
              </span>
              <span className={`block text-xs transition-colors duration-200 ${
                shareDefaults.autoPassword ? 'text-brand-orange/80' : 'text-neutral-500 dark:text-neutral-400'
              }`}>
                Automatically secure new drops with a random password
              </span>
            </div>
          </div>
          <button
            onClick={() => setShareDefaults(prev => ({ ...prev, autoPassword: !prev.autoPassword }))}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              shareDefaults.autoPassword ? 'bg-brand-orange' : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                shareDefaults.autoPassword ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <SharedProfileSettings
      user={user}
      onUpdateProfile={handleUpdateProfile}
      onUpdatePassword={handleUpdatePassword}
      onDeleteAccount={deleteAccount}
      onDeleteAllFiles={deleteAllUserFiles}
      onSetup2FA={setup2FA}
      onVerify2FA={verify2FA}
      onDisable2FA={disable2FA}
      onRegenerateRecoveryCodes={regenerateRecoveryCodes}
      onGetSessions={getUserSessions}
      onRevokeSession={revokeSession}
      onUpdatePreferences={updateUserPreferences}
      deriveAuthKey={deriveAuthKey}
      refreshUser={refresh}
      logout={logout}
      renderPreferences={renderPreferences}
      notificationOptions={NOTIFICATION_OPTIONS}
    />
  )
}
