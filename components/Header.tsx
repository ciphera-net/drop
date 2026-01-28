'use client'

import { Header as SharedHeader } from '@ciphera-net/ui'
import { useAuth } from '@/lib/auth/context'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getUserOrganizations, switchContext } from '@/lib/api/organization'
import { setSessionAction } from '@/app/actions/auth'

export default function Header() {
  const auth = useAuth()
  const router = useRouter()
  const [orgs, setOrgs] = useState<any[]>([])

  useEffect(() => {
    if (auth.user) {
      getUserOrganizations()
        .then((organizations) => setOrgs(organizations))
        .catch(err => console.error('Failed to fetch orgs', err))
    }
  }, [auth.user])

  const handleSwitchWorkspace = async (orgId: string | null) => {
    try {
      const { access_token } = await switchContext(orgId)
      // * API client uses localStorage token; cookies are for server/session consistency
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', access_token)
        if (orgId != null) {
          localStorage.setItem('active_org_id', orgId)
        } else {
          localStorage.removeItem('active_org_id')
        }
      }
      await setSessionAction(access_token)
      await auth.refresh()
      router.refresh()
    } catch (err) {
      console.error('Failed to switch workspace', err)
    }
  }

  return (
    <SharedHeader 
      auth={auth}
      LinkComponent={Link}
      logoSrc="/drop_icon_no_margins.png"
      appName="Drop"
      orgs={orgs}
      activeOrgId={auth.user?.org_id}
      onSwitchWorkspace={handleSwitchWorkspace}
      onCreateOrganization={() => window.location.href = '/dashboard/organizations/new'}
      allowPersonalWorkspace={true}
      dashboardHref="/dashboard"
    />
  )
}
