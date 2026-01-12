import { authFetch } from './client'

export interface Organization {
  id: string
  name: string
  slug: string
  plan_tier: string
  created_at: string
}

export interface OrganizationMember {
  organization_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  organization_name?: string
  organization_slug?: string
}

// Create a new organization
export async function createOrganization(name: string, slug: string): Promise<Organization> {
  // Use authFetch (Authenticated via Ciphera Auth)
  const res = await authFetch('/api/v1/auth/organizations', {
    method: 'POST',
    body: JSON.stringify({ name, slug }),
  })
  return res.json()
}

// List organizations user belongs to
export async function getUserOrganizations(): Promise<OrganizationMember[]> {
  const res = await authFetch('/api/v1/auth/organizations')
  const data = await res.json()
  return data.organizations || []
}

// Switch Context (Get token for specific org)
export async function switchContext(organizationId: string | null): Promise<{ access_token: string; expires_in: number }> {
  const res = await authFetch('/api/v1/auth/switch-context', {
    method: 'POST',
    body: JSON.stringify({ organization_id: organizationId || '' }),
  })
  return res.json()
}
