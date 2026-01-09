import ProfileSettings from '@/components/settings/ProfileSettings'

export const metadata = {
  title: 'Settings - Drop',
  description: 'Manage your account settings',
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
      <ProfileSettings />
    </div>
  )
}
