'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import Captcha from './Captcha'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaId, setCaptchaId] = useState('')
  const [captchaSolution, setCaptchaSolution] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')

  const handleCaptchaVerify = (id: string, solution: string, token?: string) => {
    setCaptchaId(id)
    setCaptchaSolution(solution)
    if (token) setCaptchaToken(token)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    // Require captcha
    const hasCaptchaToken = captchaToken && captchaToken.trim() !== ''
    const hasCaptchaSolution = captchaId && captchaSolution && captchaId.trim() !== '' && captchaSolution.trim() !== ''
    
    if (!hasCaptchaToken && !hasCaptchaSolution) {
      toast.error('Please complete the security check')
      return
    }

    setLoading(true)
    
    try {
      // * Call backend API directly
      // In production, NEXT_PUBLIC_API_URL should be set. 
      // If using proxy rewrite (like in Next.js config), /api/v1 might be mapped.
      // Assuming typical setup: Frontend -> Next.js Proxy/API -> Backend or Frontend -> Backend directly
      
      // Using relative path assuming Next.js rewrites /api/v1 to backend or using CORS
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const response = await fetch(`${apiUrl}/api/v1/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          captcha_id: captchaId,
          captcha_solution: captchaSolution,
          captcha_token: captchaToken
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit')
      }
      
      toast.success('Thank you for your feedback!')
      setMessage('')
      setCaptchaSolution('') // Reset captcha
      setCaptchaToken('')
      onClose()
    } catch (error) {
      toast.error('Failed to send feedback. Please try again.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md border border-neutral-200 dark:border-neutral-800 pointer-events-auto overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                      Send Feedback
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      Help us improve. Your feedback is anonymous.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 text-neutral-400 hover:text-neutral-500 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you like, what's broken, or what features you want..."
                    className="w-full h-32 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none resize-none mb-4 text-sm"
                    required
                  />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
                    <div className="order-2 sm:order-1">
                      <Captcha 
                        onVerify={handleCaptchaVerify}
                        className="w-full sm:w-auto" 
                      />
                    </div>
                    
                    <div className="flex justify-end gap-3 order-1 sm:order-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !message.trim()}
                        className="btn-primary py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {loading ? 'Sending...' : 'Send Feedback'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
