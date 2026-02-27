'use client'

/**
 * Offline banner shown when user loses internet connection
 */

// Inline SVG for wifi off icon
function WifiOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0" />
      <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
      <path d="M22 8.82a15 15 0 0 0-4.17-2.65" />
      <path d="M6 12a10 10 0 0 1 1.76-2.34" />
      <path d="M18 12a10 10 0 0 0-1.76-2.34" />
      <line x1="1" x2="23" y1="16" y2="16" />
    </svg>
  )
}

export function OfflineBanner({ isOnline }: { isOnline: boolean }) {
  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] rounded-b-xl bg-yellow-500/15 dark:bg-yellow-500/25 border-b border-yellow-500/30 dark:border-yellow-500/40 text-yellow-700 dark:text-yellow-300 px-4 sm:px-8 py-2.5 text-sm flex items-center justify-center gap-2 font-medium shadow-md transition-shadow duration-300">
      <WifiOffIcon className="w-4 h-4 shrink-0" />
      <span>You are currently offline. Changes may not be saved.</span>
    </div>
  )
}
