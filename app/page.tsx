'use client'

import { useState, useEffect } from 'react'
import FileUpload from '../components/FileUpload'
import ShareLink from '../components/ShareLink'

export default function HomePage() {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  
  const [text, setText] = useState('Share')
  const [isDeleting, setIsDeleting] = useState(false)
  const [wordIndex, setWordIndex] = useState(0)

  // Typewriter effect logic
  useState(() => {
    // This is just to ensure client-side hydration doesn't mismatch if we used random start
    // but here we are deterministic.
  })

  useEffect(() => {
    const words = ['Share', 'Receive', 'Encrypt']
    const currentWord = words[wordIndex % words.length]
    const typeSpeed = 150
    const deleteSpeed = 100
    const pauseTime = 2000

    let timer: NodeJS.Timeout

    if (isDeleting) {
      if (text === '') {
        // Finished deleting, move to next word
        setIsDeleting(false)
        setWordIndex((prev) => prev + 1)
      } else {
        // Deleting characters
        timer = setTimeout(() => {
          setText(text.slice(0, -1))
        }, deleteSpeed)
      }
    } else {
      if (text === currentWord) {
        // Finished typing, pause before deleting
        timer = setTimeout(() => {
          setIsDeleting(true)
        }, pauseTime)
      } else {
        // Typing characters
        timer = setTimeout(() => {
          setText(currentWord.slice(0, text.length + 1))
        }, typeSpeed)
      }
    }

    return () => clearTimeout(timer)
  }, [text, isDeleting, wordIndex])

  return (
    <main className="min-h-screen flex items-center justify-center p-4 py-12 relative overflow-hidden bg-white">
      <div className="max-w-2xl w-full space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-neutral-900">
            The Secure Way<br />
            <span className="text-brand-orange">to {text}</span>
            <span className="animate-pulse text-brand-orange">|</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 max-w-md mx-auto leading-relaxed">
            Privacy-first file sharing.<br/>
            <span className="text-neutral-400">We cannot see what you upload.</span>
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-brand-orange/5 border border-neutral-100/50 backdrop-blur-sm">
          {shareUrl ? (
            <ShareLink shareUrl={shareUrl} onReset={() => setShareUrl(null)} />
          ) : (
            <FileUpload onUploadComplete={setShareUrl} />
          )}
        </div>
      </div>
    </main>
  )
}
