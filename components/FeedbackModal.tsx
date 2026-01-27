'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Modal, Button } from '@ciphera-net/ui'
import Captcha from './Captcha'
import { useKeyboardShortcuts } from '../lib/hooks/useKeyboardShortcuts'

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaId, setCaptchaId] = useState('')
  const [captchaSolution, setCaptchaSolution] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')

  // * Keyboard Shortcuts
  useKeyboardShortcuts([
    {
      key: 'Escape',
      handler: () => {
        if (isOpen) onClose()
      }
    }
  ])

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            Send Feedback
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-normal">
            Help us improve. Your feedback is anonymous.
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what you like, what's broken, or what features you want..."
          className="w-full h-32 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none resize-none mb-4 text-sm"
          required
        />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <div className="order-2 sm:order-1 sm:mr-auto">
            <Captcha 
              onVerify={handleCaptchaVerify}
              className="!bg-transparent !border-0 !p-0"
            />
          </div>
          
          <div className="flex justify-end gap-3 order-1 sm:order-2 shrink-0 self-center">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !message.trim()}
              isLoading={loading}
            >
              Send Feedback
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
