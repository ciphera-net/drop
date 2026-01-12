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
  // * Note: authFetch returns the parsed JSON body, not the Response object
  return await authFetch<Organization>('/auth/organizations', {
    method: 'POST',
    body: JSON.stringify({ name, slug }),
  })
}

// List organizations user belongs to
export async function getUserOrganizations(): Promise<OrganizationMember[]> {
  const data = await authFetch<{ organizations: OrganizationMember[] }>('/auth/organizations')
  return data.organizations || []
}

// Switch Context (Get token for specific org)
export async function switchContext(organizationId: string | null): Promise<{ access_token: string; expires_in: number }> {
  const payload = { organization_id: organizationId || '' }
  console.log('Sending switch context request:', payload)
  return await authFetch<{ access_token: string; expires_in: number }>('/auth/switch-context', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Delete an organization
export async function deleteOrganization(organizationId: string): Promise<void> {
  await authFetch(`/auth/organizations/${organizationId}`, {
    method: 'DELETE',
  })
}
