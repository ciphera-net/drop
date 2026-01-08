'use client'

import Link from 'next/link'
import UserMenu from './UserMenu'
import { useAuth } from '@/lib/auth/context'
import { useState, useEffect, useRef } from 'react'

export default function Header() {
  const { user, loading } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Always show when near top to avoid weird behavior with bounce scroll
      if (currentScrollY < 10) {
        setIsVisible(true)
        lastScrollY.current = currentScrollY
        return
      }

      if (currentScrollY > lastScrollY.current) {
        // Scrolling down
        setIsVisible(false)
      } else {
        // Scrolling up
        setIsVisible(true)
      }
      
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pt-4 sm:pt-6 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="flex w-full max-w-6xl items-center justify-between rounded-2xl border border-neutral-200/60 bg-white/70 px-4 sm:px-8 py-3.5 shadow-xl shadow-neutral-500/10 backdrop-blur-2xl transition-all duration-300 supports-[backdrop-filter]:bg-white/50 hover:shadow-2xl hover:shadow-neutral-500/15">
        {/* * Logo Section */}
        <Link 
          href="/" 
          className="flex items-center gap-3 group relative"
        >
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-brand-orange/20 blur-md group-hover:bg-brand-orange/30 transition-all duration-300"></div>
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-brand-orange flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-md shadow-brand-orange/20 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-brand-orange/30 transition-all duration-300">
              D
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight group-hover:text-brand-orange transition-colors duration-300">
            Drop
          </span>
        </Link>

        {/* * Navigation Links - Hidden on mobile and for logged-in users, visible on larger screens for non-logged-in users */}
        {!loading && !user && (
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/about"
              className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100/50 transition-all duration-200"
            >
              About
            </Link>
            <Link
              href="/faq"
              className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100/50 transition-all duration-200"
            >
              FAQ
            </Link>
            <Link
              href="/security"
              className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100/50 transition-all duration-200"
            >
              Security
            </Link>
          </nav>
        )}

        {/* * User Menu */}
        <UserMenu />
      </div>
    </header>
  )
}
