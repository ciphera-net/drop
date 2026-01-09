'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { GridIcon, Share2Icon } from '@radix-ui/react-icons'
import { QRCodeCanvas } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKeyboardShortcuts } from '../lib/hooks/useKeyboardShortcuts'

interface ShareLinkProps {
  shareUrl: string
  onReset: () => void
  title?: string
}

export default function ShareLink({ shareUrl, onReset, title }: ShareLinkProps) {
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'Secure File Transfer',
          text: 'I sent you a secure encrypted file via Drop.',
          url: shareUrl,
        })
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled:', err)
      }
    } else {
      // Fallback to copy if share API not supported (though UI typically hides this button if unsupported, 
      // keeping it visible for consistency is better UX here with toast)
      handleCopy()
    }
  }

  // * Keyboard Shortcuts
  useKeyboardShortcuts([
    {
      key: 'c',
      ctrlKey: true,
      handler: handleCopy
    }
  ])

  return (
    <div className="space-y-6">
      <div className="p-8 bg-neutral-50/50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-700">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{title || 'Share Link Ready'}</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">
            {title ? 'Your request link has been created.' : 'Your file has been encrypted and secured. Share this link with recipients.'}
          </p>
        </div>
        
        <div className="flex flex-col gap-3 mb-6">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm font-mono text-neutral-600 dark:text-neutral-300 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all text-center"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowQr(!showQr)}
              className={`p-3 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400 h-[46px] w-[46px] flex items-center justify-center ${showQr ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
              title="Show QR Code"
            >
              <GridIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleShare}
              className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400 h-[46px] w-[46px] flex items-center justify-center sm:hidden"
              title="Share"
            >
              <Share2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 btn-secondary whitespace-nowrap !px-6 !py-3 h-[46px] flex items-center justify-center"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        <AnimatePresence>
        {showQr && (
            <motion.div
              initial={{ height: 0, opacity: 0, scale: 0.95 }}
              animate={{ height: 'auto', opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="flex flex-col items-center justify-center p-6 mb-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
              <QRCodeCanvas
                value={shareUrl}
                size={200}
                level={"H"}
                includeMargin={true}
              />
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
              Scan to open on mobile
            </p>
          </div>
            </motion.div>
        )}
        </AnimatePresence>

        <div className="flex flex-col gap-2 text-xs text-neutral-400 dark:text-neutral-500 border-t border-neutral-100 dark:border-neutral-700 pt-4">
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
