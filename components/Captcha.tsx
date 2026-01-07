'use client'

import { useState, useEffect, useCallback } from 'react'

interface CaptchaProps {
  onVerify: (id: string, solution: string) => void
  className?: string
}

export default function Captcha({ onVerify, className = '' }: CaptchaProps) {
  const [captchaId, setCaptchaId] = useState<string>('')
  const [captchaImage, setCaptchaImage] = useState<string>('')
  const [solution, setSolution] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const CAPTCHA_API = process.env.NEXT_PUBLIC_CAPTCHA_API_URL || 'http://localhost:8083/api/v1'

  const loadCaptcha = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSolution('')
    try {
      const res = await fetch(`${CAPTCHA_API}/challenge`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to load captcha')
      
      const data = await res.json()
      setCaptchaId(data.id)
      // data.image_url is relative e.g. /api/v1/image/...
      // If the API is on a different domain/port, we need to prepend the base URL
      // If it starts with /, we append to CAPTCHA_API base (removing /api/v1 if it's there? No, CAPTCHA_API includes /api/v1)
      
      // The backend returns "/api/v1/image/..."
      // If CAPTCHA_API is "http://localhost:8083/api/v1", then we just need "http://localhost:8083" + data.image_url
      // OR we can just use the ID to construct it ourselves: `${CAPTCHA_API}/image/${data.id}.png`
      
      setCaptchaImage(`${CAPTCHA_API}/image/${data.id}.png`)
      
      // Notify parent that we have a new ID (solution is empty)
      onVerify(data.id, '')
    } catch (err) {
      console.error(err)
      setError('Failed to load security check')
    } finally {
      setLoading(false)
    }
  }, [onVerify, CAPTCHA_API])

  useEffect(() => {
    loadCaptcha()
  }, [loadCaptcha])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSolution(val)
    onVerify(captchaId, val)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <label htmlFor="captcha-input" className="block text-sm font-medium text-neutral-700">
          Security Check
        </label>
        <button
          type="button"
          onClick={loadCaptcha}
          className="text-xs text-brand-orange hover:text-brand-orange-hover flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      
      <div className="flex gap-3 items-stretch">
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-center min-w-[120px] relative overflow-hidden">
            {loading ? (
                <div className="w-5 h-5 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
            ) : error ? (
                <span className="text-xs text-red-500 p-2 text-center">{error}</span>
            ) : (
                <img 
                    src={captchaImage} 
                    alt="Security Check" 
                    className="h-10 w-full object-contain"
                />
            )}
        </div>
        
        <input
          id="captcha-input"
          type="text"
          value={solution}
          onChange={handleInput}
          placeholder="Type characters"
          className="flex-1 block w-full rounded-lg border-neutral-200 shadow-sm focus:border-brand-orange focus:ring-brand-orange sm:text-sm"
          autoComplete="off"
        />
      </div>
    </div>
  )
}
