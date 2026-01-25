'use client'

import { useEffect } from 'react'
import { initiateOAuthFlow } from '@/lib/api/oauth'
import { LoadingOverlay } from '@ciphera-net/ui'

export default function LoginPage() {
  useEffect(() => {
    initiateOAuthFlow()
  }, [])

  return <LoadingOverlay logoSrc="/drop_icon_no_margins.png" title="Drop" />
}
