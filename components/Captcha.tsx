'use client'

import { useState, useEffect, useCallback } from 'react'
import { solvePoW } from '../lib/utils/pow'

export interface CaptchaProps {
  /**
   * Callback when captcha is verified
   * @param id - Captcha ID (empty for PoW)
   * @param solution - Captcha solution (empty for PoW)
   * @param token - JWT token from successful verification
   */
  onVerify: (id: string, solution: string, token?: string) => void
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Base URL for the captcha API
   * @default 'http://localhost:8083/api/v1'
   */
  apiUrl?: string
  /**
   * URL to the Ciphera logo image
   * @default '/ciphera_logo.png'
   */
  logoUrl?: string
  /**
   * Custom brand color class for checkbox (Tailwind)
   * @default 'text-brand-orange focus:ring-brand-orange'
   */
  brandColorClass?: string
  /**
   * Custom border color class for checkbox (Tailwind)
   * @default 'border-brand-orange'
   */
  borderColorClass?: string
}

export default function Captcha({ 
  onVerify, 
  className = '',
  apiUrl,
  logoUrl = '/ciphera_logo.png',
  brandColorClass = 'text-brand-orange focus:ring-brand-orange',
  borderColorClass = 'border-brand-orange'
}: CaptchaProps) {
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [challenge, setChallenge] = useState<any>(null)
  const [verified, setVerified] = useState(false)

  // * Use provided API URL or fall back to environment variable or default
  const CAPTCHA_API = apiUrl || 
    (typeof window !== 'undefined' && (window as any).process?.env?.NEXT_PUBLIC_CAPTCHA_API_URL) ||
    process.env.NEXT_PUBLIC_CAPTCHA_API_URL || 
    'http://localhost:8083/api/v1'

  const loadChallenge = useCallback(async () => {
    setLoading(true)
    setError(null)
    setVerified(false)
    try {
      // * Request PoW challenge
      const res = await fetch(`${CAPTCHA_API}/challenge?type=pow`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to load security check')
      
      const data = await res.json()
      setChallenge(data)
    } catch (err) {
      console.error(err)
      setError('Failed to load security check')
    } finally {
      setLoading(false)
    }
  }, [CAPTCHA_API])

  useEffect(() => {
    loadChallenge()
  }, [loadChallenge])

  const verifyHuman = async () => {
    if (!challenge || verifying) return
    setVerifying(true)
    setError(null)

    try {
      // * Artificial delay for UX (minimum 1.5s spinner)
      const minDelay = new Promise(resolve => setTimeout(resolve, 1500))

      // * 1. Solve PoW
      const nonce = await solvePoW(challenge.seed, challenge.difficulty)

      // * 2. Verify with backend
      const requestPromise = fetch(`${CAPTCHA_API}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pow',
          seed: challenge.seed,
          nonce: nonce,
          timestamp: challenge.timestamp,
          signature: challenge.signature
        })
      })

      // * Wait for both the minimum delay and the request
      const [_, res] = await Promise.all([minDelay, requestPromise])

      const data = await res.json()
      
      if (!res.ok || !data.valid) {
        throw new Error(data.error || 'Verification failed')
      }

      setVerified(true)
      // * Pass the token up
      onVerify('', '', data.token) 
    } catch (err: any) {
        console.error(err)
        setError(err.message || 'Verification failed')
        // * Load new challenge on failure to prevent replay
        loadChallenge()
    } finally {
        setVerifying(false)
    }
  }

  if (verified) {
      return (
          <div className={`p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 flex items-center gap-2 ${className}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">Verified human</span>
          </div>
      )
  }

  return (
    <div className={`bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                 <div className="relative flex items-center justify-center">
                    <input 
                        type="checkbox" 
                        checked={false} 
                        onChange={verifyHuman}
                        disabled={loading || verifying || !challenge}
                        className={`w-6 h-6 rounded border-neutral-300 dark:border-neutral-600 dark:bg-neutral-800 ${brandColorClass} ${borderColorClass} cursor-pointer disabled:opacity-50`}
                    />
                    {(loading || verifying) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-800/80 rounded z-10">
                            <div className={`w-5 h-5 border-2 ${borderColorClass} border-t-transparent rounded-full animate-spin`}></div>
                        </div>
                    )}
                 </div>
                 <span 
                    className={`text-sm font-medium text-neutral-700 dark:text-neutral-200 mr-3 ${loading || verifying ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                    onClick={() => !loading && !verifying && verifyHuman()}
                >
                     {verifying ? 'Verifying...' : 'I am human'}
                 </span>
            </div>
            <div className="text-[11px] text-neutral-400 dark:text-neutral-500 flex flex-col items-end border-l border-neutral-200 dark:border-neutral-700 pl-3">
                <div className="flex items-center gap-2 opacity-90">
                    <img 
                        src={logoUrl}
                        alt="Ciphera" 
                        className="h-5 w-auto object-contain"
                    />
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px]">Secured by</span>
                        <span className="font-bold text-neutral-700 dark:text-neutral-200 text-sm">Ciphera</span>
                    </div>
                </div>
            </div>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  )
}
