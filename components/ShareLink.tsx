'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface ShareLinkProps {
  shareUrl: string
  onReset: () => void
  title?: string
}

export default function ShareLink({ shareUrl, onReset, title }: ShareLinkProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('Failed to copy link')
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-8 bg-neutral-50/50 rounded-xl border border-neutral-100">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900">{title || 'Share Link Ready'}</h2>
          <p className="text-sm text-neutral-500 mt-1 max-w-sm">
            {title ? 'Your request link has been created.' : 'Your file has been encrypted and secured. Share this link with recipients.'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 mb-6">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl bg-white text-sm font-mono text-neutral-600 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all"
          />
          <button
            onClick={handleCopy}
            className="btn-secondary whitespace-nowrap !px-6 !py-3 h-[46px] flex items-center"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        <div className="flex flex-col gap-2 text-xs text-neutral-400 border-t border-neutral-100 pt-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>End-to-end encrypted zero-knowledge storage</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Only accessible via this unique link</span>
          </div>
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full btn-secondary"
      >
        {title ? 'Create Another Request' : 'Upload Another File'}
      </button>
    </div>
  )
}
