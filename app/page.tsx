'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import FileUpload from '../components/FileUpload'
import FileRequest from '../components/FileRequest'
import ShareLink from '../components/ShareLink'
import { useAuth } from '@/lib/auth/context'

export default function HomePage() {
  const { user } = useAuth()
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  
  // * 'send' | 'receive' mode state
  const [mode, setMode] = useState<'send' | 'receive'>('send')

  const [text, setText] = useState('Share')
  const [isDeleting, setIsDeleting] = useState(false)
  const [wordIndex, setWordIndex] = useState(0)

  // Typewriter effect logic
  useEffect(() => {
    const words = ['Share', 'Receive', 'Encrypt']
    const currentWord = words[wordIndex % words.length]
    const typeSpeed = 150
    const deleteSpeed = 100
    const pauseTime = 2000

    let timer: NodeJS.Timeout

    if (isDeleting) {
      if (text === '') {
        setIsDeleting(false)
        setWordIndex((prev) => prev + 1)
      } else {
        timer = setTimeout(() => {
          setText(text.slice(0, -1))
        }, deleteSpeed)
      }
    } else {
      if (text === currentWord) {
        timer = setTimeout(() => {
          setIsDeleting(true)
        }, pauseTime)
      } else {
        timer = setTimeout(() => {
          setText(currentWord.slice(0, text.length + 1))
        }, typeSpeed)
      }
    }

    return () => clearTimeout(timer)
  }, [text, isDeleting, wordIndex])

  return (
    <main className="min-h-screen flex items-center justify-center p-4 pt-12 pb-32 relative overflow-hidden bg-white">
      <div className="max-w-2xl w-full space-y-8 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-neutral-900 mb-4">
            The Secure Way<br />
            <span className="text-brand-orange">to {text}</span>
            <span className="animate-pulse text-brand-orange">|</span>
          </h1>
        </div>

        {/* * Magnetic Toggle Buttons */}
        <div className="flex justify-center mb-6">
          <div className="bg-neutral-100 p-1.5 rounded-xl inline-flex relative border border-neutral-200 shadow-sm">
            {['send', 'receive'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setMode(tab as 'send' | 'receive')
                  setShareUrl(null)
                }}
                className={`relative px-6 py-2 rounded-xl text-sm font-medium transition-colors z-10 capitalize ${
                  mode === tab ? 'text-white' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {tab}
                {mode === tab && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-brand-orange rounded-xl shadow-md shadow-brand-orange/25"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl shadow-neutral-200/50 border border-neutral-200 backdrop-blur-sm max-w-md w-full mx-auto flex flex-col justify-center transition-all duration-300 aspect-square">
          {shareUrl ? (
            <ShareLink 
              shareUrl={shareUrl} 
              onReset={() => setShareUrl(null)}
              title={mode === 'receive' ? 'Your Request Link' : undefined}
            />
          ) : (
            mode === 'send' ? (
              <FileUpload onUploadComplete={setShareUrl} />
            ) : (
              // * Receive Mode
              <div className="h-full w-full">
                {user ? (
                  // Authenticated View
                  <FileRequest onRequestCreated={setShareUrl} />
                ) : (
                  // Unauthenticated View
                  <div className="text-center flex flex-col items-center justify-center h-full">
                    <div className="w-20 h-20 bg-brand-orange/5 rounded-full flex items-center justify-center mb-5 shadow-sm border border-brand-orange/10">
                      <svg className="w-10 h-10 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-neutral-900 mb-2">Authentication Required</h3>
                    
                    <p className="text-neutral-500 mb-6 max-w-xs leading-relaxed">
                      To ensure security, you must be signed in to request encrypted files from others.
                    </p>
                    
                    <div className="w-full max-w-xs space-y-3">
                      <Link 
                        href="/login" 
                        className="btn-primary block w-full text-center"
                      >
                        Log In
                      </Link>
                      <Link 
                        href="/signup" 
                        className="btn-secondary block w-full text-center"
                      >
                        Create Account
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </main>
  )
}
