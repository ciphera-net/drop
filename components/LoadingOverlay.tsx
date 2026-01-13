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
        <div className="flex items-center gap-3">
          <img 
            src="/ciphera_icon_no_margins.png" 
            alt="Ciphera" 
            className="h-12 w-auto object-contain"
          />
          <span className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Ciphera
          </span>
        </div>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-orange dark:border-neutral-800 dark:border-t-brand-orange" />
      </div>
    </div>,
    document.body
  )
}
