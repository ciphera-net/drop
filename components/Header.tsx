'use client'

import { Header as UIHeader } from '@ciphera-net/ui'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/context'

export default function Header() {
  const { user, loading, logout } = useAuth()
  
  return (
    <UIHeader 
      auth={{ user, loading, logout }}
      LinkComponent={Link}
      appName="Drop"
      logoSrc="/drop_icon_no_margins.png"
    />
  )
}
