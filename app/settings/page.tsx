import { Metadata } from 'next'
import SettingsPageClient from './SettingsPageClient'

export const metadata: Metadata = {
  title: 'Settings - Drop',
  description: 'Manage your Drop preferences and Ciphera account settings',
}

export default function SettingsPage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <SettingsPageClient />
    </div>
  )
}
