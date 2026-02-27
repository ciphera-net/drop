/**
 * Notification utilities for formatting and icon selection
 */

import {
  AlertTriangleIcon,
  CheckCircleIcon,
  DownloadIcon,
  BoxIcon,
  LockIcon,
  UserIcon,
  Share2Icon,
} from '@ciphera-net/ui'

// Simple SVG icons for types not in ciphera-ui
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

/**
 * Format a date to relative time (e.g. "2 hours ago", "just now")
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
  if (seconds < 2592000) {
    const weeks = Math.floor(seconds / 604800)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  }

  const months = Math.floor(seconds / 2592000)
  return `${months} month${months > 1 ? 's' : ''} ago`
}

/**
 * Get the appropriate icon for a notification type
 */
export function getTypeIcon(type: string): JSX.Element {
  const iconClass = "w-5 h-5 shrink-0"
  const iconColor = "text-neutral-500 dark:text-neutral-400"

  switch (type) {
    case 'file_downloaded':
      return <DownloadIcon className={`${iconClass} ${iconColor}`} />
    case 'file_received':
      return <BoxIcon className={`${iconClass} ${iconColor}`} />
    case 'file_expiring':
      return <ClockIcon className={`${iconClass} ${iconColor}`} />
    case 'share_accessed':
      return <Share2Icon className={`${iconClass} ${iconColor}`} />
    case 'security_alert':
      return <LockIcon className={`${iconClass} text-red-500`} />
    case 'success':
      return <CheckCircleIcon className={`${iconClass} text-green-500`} />
    case 'warning':
      return <AlertTriangleIcon className={`${iconClass} text-amber-500`} />
    case 'user_invited':
      return <UserIcon className={`${iconClass} ${iconColor}`} />
    default:
      return <InfoIcon className={`${iconClass} ${iconColor}`} />
  }
}
