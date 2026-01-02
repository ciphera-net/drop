'use client'

import { useEffect, useState, use } from 'react'
import DownloadPageComponent from '@/components/DownloadPage'

interface DownloadPageProps {
  params: Promise<{
    shareId: string
  }>
}

export default function DownloadPage({ params }: DownloadPageProps) {
  const { shareId } = use(params)
  const [encryptionKey, setEncryptionKey] = useState<string | undefined>()

  useEffect(() => {
    // * Extract encryption key from URL hash
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1) // Remove #
      if (hash) {
        setEncryptionKey(hash)
      }
    }
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center p-4 py-12">
      <DownloadPageComponent shareId={shareId} encryptionKey={encryptionKey} />
    </main>
  )
}
