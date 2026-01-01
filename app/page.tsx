'use client'

import { useState } from 'react'
import FileUpload from '../components/FileUpload'
import ShareLink from '../components/ShareLink'

export default function HomePage() {
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  return (
    <main className="min-h-screen flex items-center justify-center p-4 py-12">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Drop
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
            Privacy-first file sharing. We cannot see what you upload.
          </p>
        </div>

        {shareUrl ? (
          <ShareLink shareUrl={shareUrl} onReset={() => setShareUrl(null)} />
        ) : (
          <FileUpload onUploadComplete={setShareUrl} />
        )}
      </div>
    </main>
  )
}
