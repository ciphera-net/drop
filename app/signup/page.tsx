'use client'

import { useEffect } from 'react'
import { initiateSignupFlow } from '@/lib/api/oauth'
import { LoadingOverlay } from '@ciphera-net/ui'

export default function SignupPage() {
  useEffect(() => {
    initiateSignupFlow()
  }, [])

  return <LoadingOverlay logoSrc="/drop_icon_no_margins.png" title="Drop" />
}
