'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import apiRequest from '@/lib/api/client'
import { LoadingOverlay, useSessionSync, SessionExpiryWarning } from '@ciphera-net/ui'
import { logoutAction, getSessionAction } from '@/app/actions/auth'

interface UserPreferences {
  email_notifications: {
    new_file_received: boolean
    file_downloaded: boolean
    login_alerts: boolean
    password_alerts: boolean
    two_factor_alerts: boolean
  }
}

interface User {
  id: string
  email: string
  display_name?: string
  totp_enabled: boolean
  org_id?: string
  role?: string
  preferences?: UserPreferences
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (user: User) => void
  logout: () => void
  refresh: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refresh: async () => {},
  refreshSession: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const login = (userData: User) => {
    // * We store user profile in localStorage for optimistic UI, but NOT the token
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    router.refresh()
    // * Fetch full profile (including display_name) so header shows correct name without page refresh
    apiRequest<User>('/auth/user/me')
      .then((fullProfile) => {
        setUser((prev) => {
          const merged = {
            ...fullProfile,
            org_id: prev?.org_id ?? fullProfile.org_id,
            role: prev?.role ?? fullProfile.role,
          }
          localStorage.setItem('user', JSON.stringify(merged))
          return merged
        })
      })
      .catch((e) => console.error('Failed to fetch full profile after login', e))
  }

  const logout = useCallback(async () => {
    setIsLoggingOut(true)
    await logoutAction()
    localStorage.removeItem('user')
    // * Broadcast logout to other tabs (BroadcastChannel will handle if available)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('ciphera_session')
      channel.postMessage({ type: 'LOGOUT' })
      channel.close()
    }
    setTimeout(() => {
      window.location.href = '/'
    }, 500)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const userData = await apiRequest<User>('/auth/user/me')
      setUser((prev) => {
        const merged = {
          ...userData,
          org_id: prev?.org_id,
          role: prev?.role,
        }
        localStorage.setItem('user', JSON.stringify(merged))
        return merged
      })
    } catch (e) {
      console.error('Failed to refresh user data', e)
    }
    router.refresh()
  }, [router])

  const refreshSession = useCallback(async () => {
    await refresh()
  }, [refresh])

  // * Sync session across browser tabs using BroadcastChannel
  useSessionSync({
    onLogout: () => {
      localStorage.removeItem('user')
      window.location.href = '/'
    },
    onLogin: (userData) => {
      setUser(userData as User)
      router.refresh()
    },
    onRefresh: () => {
      refresh()
    },
  })

  // Initial load
  useEffect(() => {
    const init = async () => {
      // * 1. Check server-side session (cookies)
      let session = await getSessionAction()

      // * 2. If no access_token but refresh_token may exist, try refresh (fixes 15-min inactivity logout)
      if (!session && typeof window !== 'undefined') {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
        if (refreshRes.ok) {
          session = await getSessionAction()
        }
      }

      if (session) {
        setUser(session)
        localStorage.setItem('user', JSON.stringify(session))
        // * Fetch full profile (including display_name) from API; preserve org_id/role from session
        try {
          const userData = await apiRequest<User>('/auth/user/me')
          const merged = { ...userData, org_id: session.org_id, role: session.role }
          setUser(merged)
          localStorage.setItem('user', JSON.stringify(merged))
        } catch (e) {
          console.error('Failed to fetch full profile', e)
        }
      } else {
        // * Session invalid/expired
        localStorage.removeItem('user')
        setUser(null)
      }

      setLoading(false)
    }
    init()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh, refreshSession }}>
      {isLoggingOut && <LoadingOverlay logoSrc="/drop_icon_no_margins.png" title="Drop" />}
      <SessionExpiryWarning
        isAuthenticated={!!user}
        onExtendSession={refresh}
        onExpired={logout}
      />
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
