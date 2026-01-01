'use client'

import { useState } from 'react'

interface ShareLinkProps {
  shareUrl: string
  onReset: () => void
}

export default function ShareLink({ shareUrl, onReset }: ShareLinkProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <h2 className="text-xl font-semibold mb-4">Share Link Generated</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Your file has been encrypted and uploaded. Share this link with anyone you want to give access to.
        </p>
        
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm font-mono"
          />
          <button
            onClick={handleCopy}
            className="btn-secondary whitespace-nowrap"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="text-xs text-neutral-500 dark:text-neutral-500 space-y-1">
          <p>• Files are encrypted before upload</p>
          <p>• Only people with this link can download</p>
          <p>• The encryption key is in the URL hash</p>
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full btn-secondary"
      >
        Upload Another File
      </button>
    </div>
  )
}
