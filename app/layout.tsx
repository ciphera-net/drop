import { AuthProvider } from '@/lib/auth/context'
import { ThemeProviders, Toaster } from '@ciphera-net/ui'
import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import LayoutContent from './LayoutContent'
import '../styles/globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Drop - The Secure Way to Share',
  description: 'Secure file sharing with end-to-end encryption. We cannot see what you upload.',
  keywords: ['file sharing', 'privacy', 'encryption', 'secure', 'ciphera'],
  authors: [{ name: 'Ciphera' }],
  creator: 'Ciphera',
  publisher: 'Ciphera',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/drop_icon_no_margins.png',
  },
  // * Privacy-first: No tracking
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Drop',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#FD5E0F',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={plusJakartaSans.variable} suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
        <ThemeProviders>
          <AuthProvider>
            <LayoutContent>{children}</LayoutContent>
            <Toaster />
          </AuthProvider>
        </ThemeProviders>
      </body>
    </html>
  )
}
