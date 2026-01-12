'use client'

import { useState, useEffect, useRef } from 'react'
import UserMenu from './UserMenu'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/context'
import { HamburgerMenuIcon, Cross1Icon } from '@radix-ui/react-icons'

export default function Header() {
  const { user, loading, logout } = useAuth()
  
  const [isVisible, setIsVisible] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Always show when near top
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
      <div className="flex w-full max-w-6xl items-center justify-between rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/70 dark:bg-neutral-900/70 px-4 sm:px-8 py-3.5 shadow-xl shadow-neutral-500/10 dark:shadow-black/20 backdrop-blur-2xl transition-all duration-300 supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-neutral-900/50 hover:shadow-2xl hover:shadow-neutral-500/15 dark:hover:shadow-black/30">
        {/* Logo Section */}
        <Link 
          href="/" 
          className="flex items-center gap-3 group relative"
        >
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
            <img 
              src="/drop_icon_no_margins.png"
              alt="Drop Logo"
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 transform-gpu will-change-transform [backface-visibility:hidden]"
            />
          </div>
          <span className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight group-hover:text-brand-orange transition-colors duration-300">
            Drop
          </span>
        </Link>

        {/* Navigation Links - Hidden on mobile and for logged-in users */}
        {!loading && !user && (
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/about"
              className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-all duration-200"
            >
              Why Drop
            </Link>
            <Link
              href="/faq"
              className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-all duration-200"
            >
              FAQ
            </Link>
            <Link
              href="/security"
              className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-all duration-200"
            >
              Security
            </Link>
          </nav>
        )}

        {/* User Menu */}
        <div className="flex items-center gap-3">
          {/* ThemeToggle removed from here */}
          <UserMenu />
          
          {/* Mobile Menu Toggle */}
          {!loading && !user && (
            <button
              className="md:hidden p-2 -mr-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <Cross1Icon className="w-5 h-5" /> : <HamburgerMenuIcon className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
      
      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && !loading && !user && (
        <div className="absolute top-full left-0 right-0 p-4 md:hidden animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-2 flex flex-col gap-1">
            <Link
              href="/about"
              className="px-4 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-all duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Why Drop
            </Link>
            <Link
              href="/faq"
              className="px-4 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-all duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            <Link
              href="/security"
              className="px-4 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-all duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Security
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
