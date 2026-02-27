/**
 * Notification utilities for formatting and icon selection
 */

import {
  InfoIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  DownloadIcon,
  FileIcon,
  ClockIcon,
  ShieldIcon,
  UserIcon,
  LinkIcon,
} from '@ciphera-net/ui'

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
      return <FileIcon className={`${iconClass} ${iconColor}`} />
    case 'file_expiring':
      return <ClockIcon className={`${iconClass} ${iconColor}`} />
    case 'share_accessed':
      return <LinkIcon className={`${iconClass} ${iconColor}`} />
    case 'security_alert':
      return <ShieldIcon className={`${iconClass} text-red-500`} />
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
