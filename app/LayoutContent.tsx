'use client'

/**
 * Layout content wrapper with offline detection
 */

import { useAuth } from '@/lib/auth/context'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { OfflineBanner } from '@/components/OfflineBanner'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

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
    <>
      {auth.user && <OfflineBanner isOnline={isOnline} />}
      <Header />
      <main
        className={`flex-1 pb-8 ${showOfflineBar ? '' : 'pt-24'}`}
        style={showOfflineBar ? { paddingTop: `${mainTopPaddingRem}rem` } : undefined}
      >
        {children}
      </main>
      <Footer />
    </>
  )
}
