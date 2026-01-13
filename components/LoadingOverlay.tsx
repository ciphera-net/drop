'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function LoadingOverlay() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-neutral-950 animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-6">
        <img 
          src="/ciphera_logo_no_margins.png" 
          alt="Ciphera" 
          className="h-12 w-auto object-contain dark:invert dark:hue-rotate-180"
        />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-orange dark:border-neutral-800 dark:border-t-brand-orange" />
      </div>
    </div>,
    document.body
  )
}
