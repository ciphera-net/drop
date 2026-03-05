'use client'

/**
 * Layout content wrapper with offline detection
 */

import { useAuth } from '@/lib/auth/context'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { OfflineBanner } from '@/components/OfflineBanner'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { SettingsModalProvider } from '@/lib/settings-modal-context'
import SettingsModalWrapper from '@/components/settings/SettingsModalWrapper'

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = useAuth()
  const isOnline = useOnlineStatus()

  const showOfflineBar = Boolean(auth.user && !isOnline)
  const barHeightRem = 2.5
  const headerHeightRem = 6
  const mainTopPaddingRem = barHeightRem + headerHeightRem

  return (
    <SettingsModalProvider>
      {auth.user && <OfflineBanner isOnline={isOnline} />}
      <Header />
      <main
        className={`flex-1 pb-8 ${showOfflineBar ? '' : 'pt-24'}`}
        style={showOfflineBar ? { paddingTop: `${mainTopPaddingRem}rem` } : undefined}
      >
        {children}
      </main>
      <Footer />
      <SettingsModalWrapper />
    </SettingsModalProvider>
  )
}
