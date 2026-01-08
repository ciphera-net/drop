'use client'

import { useState, useEffect, useCallback } from 'react'
import { solvePoW } from '../lib/crypto/pow'

interface CaptchaProps {
  onVerify: (id: string, solution: string, token?: string) => void
  className?: string
}

export default function Captcha({ onVerify, className = '' }: CaptchaProps) {
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [challenge, setChallenge] = useState<any>(null)
  const [verified, setVerified] = useState(false)

  const CAPTCHA_API = process.env.NEXT_PUBLIC_CAPTCHA_API_URL || 'http://localhost:8083/api/v1'

  const loadChallenge = useCallback(async () => {
    setLoading(true)
    setError(null)
    setVerified(false)
    try {
      // Request PoW challenge
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

      // 1. Solve PoW
      const nonce = await solvePoW(challenge.seed, challenge.difficulty)

      // 2. Verify with backend
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
      // Pass the token up
      onVerify('', '', data.token) 
    } catch (err: any) {
        console.error(err)
        setError(err.message || 'Verification failed')
        // Load new challenge on failure to prevent replay
        loadChallenge()
    } finally {
        setVerifying(false)
    }
  }

  if (verified) {
      return (
          <div className={`p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2 ${className}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">Verified human</span>
          </div>
      )
  }

  return (
    <div className={`bg-neutral-50 border border-neutral-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                 <div className="relative flex items-center justify-center">
                    <input 
                        type="checkbox" 
                        checked={false} 
                        onChange={verifyHuman}
                        disabled={loading || verifying || !challenge}
                        className="w-6 h-6 rounded border-neutral-300 text-brand-orange focus:ring-brand-orange cursor-pointer disabled:opacity-50"
                    />
                    {(loading || verifying) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded z-10">
                            <div className="w-5 h-5 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                 </div>
                 <span 
                    className={`text-sm font-medium text-neutral-700 ${loading || verifying ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                    onClick={() => !loading && !verifying && verifyHuman()}
                >
                     {verifying ? 'Verifying...' : 'I am human'}
                 </span>
            </div>
            <div className="text-[11px] text-neutral-400 flex flex-col items-end">
                <div className="flex items-center gap-2 opacity-90">
                    <img 
                        src="/ciphera_logo.png" 
                        alt="" 
                        className="h-5 w-auto object-contain"
                    />
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px]">Secured by</span>
                        <span className="font-bold text-neutral-700 text-sm">Ciphera</span>
                    </div>
                </div>
            </div>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  )
}
