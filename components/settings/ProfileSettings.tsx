'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { PersonIcon, LockClosedIcon, EnvelopeClosedIcon, CheckIcon, ExclamationTriangleIcon, Cross2Icon, GearIcon, SunIcon, MoonIcon, LaptopIcon } from '@radix-ui/react-icons'
import { PasswordInput, Button, Input } from '@ciphera-net/ui'
import { toast } from 'sonner'
import api from '@/lib/api/client'
import { deriveAuthKey } from '@/lib/crypto/password'

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

export default function ProfileSettings() {
  const { user, refresh } = useAuth()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile')
  
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

  // Profile State
  const [email, setEmail] = useState(user?.email || '')
  const [isEmailDirty, setIsEmailDirty] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)
  
  // Email Password Prompt State
  const [showEmailPasswordPrompt, setShowEmailPasswordPrompt] = useState(false)
  const [emailConfirmPassword, setEmailConfirmPassword] = useState('')

  // Security State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loadingSecurity, setLoadingSecurity] = useState(false)
  const [securityError, setSecurityError] = useState<string | null>(null)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || email === user?.email) return
    
    // Show password prompt if not visible
    if (!showEmailPasswordPrompt) {
      setShowEmailPasswordPrompt(true)
      return
    }

    // Actual submission with password
    setLoadingProfile(true)
    try {
      if (!user?.email) throw new Error('User email not found')

      const currentDerivedKey = await deriveAuthKey(emailConfirmPassword, user.email)
      const newDerivedKey = await deriveAuthKey(emailConfirmPassword, email) // Derive with NEW email

      await api('/auth/user/email', {
        method: 'PUT',
        body: JSON.stringify({
          email: email,
          current_password: currentDerivedKey,
          new_derived_key: newDerivedKey
        })
      })
      
      toast.success('Profile updated successfully. Please verify your new email.')
      refresh()
      setShowEmailPasswordPrompt(false)
      setEmailConfirmPassword('')
      setIsEmailDirty(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
      console.error(err)
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setSecurityError(null)

    if (newPassword !== confirmPassword) {
      setSecurityError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setSecurityError('Password must be at least 8 characters')
      return
    }

    setLoadingSecurity(true)
    try {
      if (!user?.email) throw new Error('User email not found')

      const currentDerivedKey = await deriveAuthKey(currentPassword, user.email)
      const newDerivedKey = await deriveAuthKey(newPassword, user.email)

      await api('/auth/user/password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: currentDerivedKey,
          new_password: newDerivedKey
        })
      })
      
      toast.success('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password')
      setSecurityError(err.message || 'Failed to update password')
    } finally {
      setLoadingSecurity(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <nav className="w-full md:w-64 flex-shrink-0 space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-brand-orange/10 text-brand-orange'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <PersonIcon className="w-5 h-5" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              activeTab === 'security'
                ? 'bg-brand-orange/10 text-brand-orange'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <LockClosedIcon className="w-5 h-5" />
            Security
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              activeTab === 'preferences'
                ? 'bg-brand-orange/10 text-brand-orange'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <GearIcon className="w-5 h-5" />
            Preferences
          </button>
        </nav>

        {/* Content Area */}
        <div className="flex-1 relative">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 shadow-sm"
          >
            {activeTab === 'preferences' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">Appearance</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Customize how Drop looks on your device.</p>
                  
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                        theme === 'light'
                          ? 'bg-brand-orange/5 border-brand-orange text-brand-orange'
                          : 'bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <SunIcon className="w-6 h-6" />
                      <span className="text-sm font-medium">Light</span>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                        theme === 'dark'
                          ? 'bg-brand-orange/5 border-brand-orange text-brand-orange'
                          : 'bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <MoonIcon className="w-6 h-6" />
                      <span className="text-sm font-medium">Dark</span>
                    </button>
                    <button
                      onClick={() => setTheme('system')}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                        theme === 'system'
                          ? 'bg-brand-orange/5 border-brand-orange text-brand-orange'
                          : 'bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <LaptopIcon className="w-6 h-6" />
                      <span className="text-sm font-medium">System</span>
                    </button>
                  </div>
                </div>

                <hr className="border-neutral-100 dark:border-neutral-800" />

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
                          <LockClosedIcon className="w-5 h-5" />
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
              </div>
            )}

            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">Profile Information</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Update your account details.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Email Address
                    </label>
                    <div className="relative group">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setIsEmailDirty(e.target.value !== user.email)
                        }}
                        className="w-full pl-11 pr-4 py-3 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/50 focus:bg-white dark:focus:bg-neutral-900 
                        focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 outline-none transition-all duration-200 dark:text-white"
                      />
                      <EnvelopeClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500 group-focus-within:text-brand-orange transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={!isEmailDirty || loadingProfile}
                    className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium 
                    hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loadingProfile ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">Security Settings</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Update your password to keep your account secure.</p>
                </div>

                {securityError && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400">
                    <ExclamationTriangleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{securityError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <PasswordInput
                    label="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <hr className="border-neutral-100 dark:border-neutral-800 my-4" />
                  <PasswordInput
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <PasswordInput
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={!currentPassword || !newPassword || !confirmPassword || loadingSecurity}
                    className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium 
                    hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loadingSecurity ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Email Password Confirmation Modal */}
            <AnimatePresence>
              {showEmailPasswordPrompt && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl"
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-sm bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Confirm Change</h3>
                      <button 
                        onClick={() => {
                          setShowEmailPasswordPrompt(false)
                          setEmailConfirmPassword('')
                          setLoadingProfile(false)
                        }}
                        className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white"
                      >
                        <Cross2Icon className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                      Please enter your password to confirm changing your email to <span className="font-medium text-neutral-900 dark:text-white">{email}</span>.
                    </p>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <PasswordInput
                        label="Password"
                        value={emailConfirmPassword}
                        onChange={(e) => setEmailConfirmPassword(e.target.value)}
                        required
                        className="mb-2"
                      />
                      
                      <div className="flex gap-3">
                         <button
                          type="button"
                          onClick={() => {
                            setShowEmailPasswordPrompt(false)
                            setEmailConfirmPassword('')
                            setLoadingProfile(false)
                          }}
                          className="flex-1 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!emailConfirmPassword || loadingProfile}
                          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {loadingProfile ? 'Updating...' : 'Confirm'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
