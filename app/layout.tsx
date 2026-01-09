import Header from '../components/Header'
import Footer from '../components/Footer'
import { AuthProvider } from '@/lib/auth/context'
import { ThemeProviders } from '../components/ThemeProviders'
import { Toaster } from 'sonner'
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
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
    icon: '/drop_icon_no_margins.png',
    shortcut: '/drop_icon_no_margins.png',
    apple: '/drop_icon_no_margins.png',
  },
  // * Privacy-first: No tracking
  robots: {
    index: true,
    follow: true,
  },
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
            <Header />
            <main className="flex-1 pt-24 pb-8">
              {children}
            </main>
            <Footer />
            <Toaster position="top-center" richColors closeButton />
          </AuthProvider>
        </ThemeProviders>
      </body>
    </html>
  )
}
