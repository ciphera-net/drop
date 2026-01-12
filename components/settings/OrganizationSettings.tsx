'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { 
  deleteOrganization, 
  switchContext, 
  getOrganizationMembers, 
  getInvitations, 
  sendInvitation, 
  revokeInvitation,
  OrganizationMember,
  OrganizationInvitation 
} from '@/lib/api/organization'
import { toast } from 'sonner'
import { ExclamationTriangleIcon, PlusIcon, TrashIcon, ReloadIcon } from '@radix-ui/react-icons'
import { Button, Input } from '@ciphera-net/ui'

export default function OrganizationSettings() {
  const { user } = useAuth()
  const router = useRouter()
  const [showDeletePrompt, setShowDeletePrompt] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Team State
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([])
  const [isLoadingTeam, setIsLoadingTeam] = useState(true)
  
  // Invite State
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [isInviting, setIsInviting] = useState(false)

  const getOrgIdFromToken = () => {
    if (typeof window === 'undefined') return null
    const token = localStorage.getItem('token')
    if (!token) return null
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.org_id || null
    } catch (e) {
        return null
    }
  }

  const currentOrgId = getOrgIdFromToken()

  const loadTeam = useCallback(async () => {
    if (!currentOrgId) return
    try {
      const [membersData, invitesData] = await Promise.all([
        getOrganizationMembers(currentOrgId),
        getInvitations(currentOrgId)
      ])
      setMembers(membersData)
      setInvitations(invitesData)
    } catch (error) {
      console.error('Failed to load team:', error)
      // toast.error('Failed to load team members')
    } finally {
      setIsLoadingTeam(false)
    }
  }, [currentOrgId])

  useEffect(() => {
    if (currentOrgId) {
      loadTeam()
    } else {
      setIsLoadingTeam(false)
    }
  }, [currentOrgId, loadTeam])

  // If no org ID, we are in personal workspace, so don't show org settings
  if (!currentOrgId) {
    return (
        <div className="p-6 text-center text-neutral-500">
            <p>You are in your Personal Workspace. Switch to an Organization to manage its settings.</p>
        </div>
    )
  }

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') return
    
    setIsDeleting(true)
    try {
      await deleteOrganization(currentOrgId)
      toast.success('Organization deleted successfully')
      
      // * Clear sticky session
      localStorage.removeItem('active_org_id')
      
      // * Switch to personal context explicitly
      try {
        const { access_token } = await switchContext(null)
        localStorage.setItem('token', access_token)
        window.location.href = '/dashboard'
      } catch (switchErr) {
        console.error('Failed to switch to personal context after delete:', switchErr)
        // Fallback: reload and let backend handle invalid token if any
        window.location.href = '/dashboard'
      }
      
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to delete organization')
      setIsDeleting(false)
    }
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return

    setIsInviting(true)
    try {
      await sendInvitation(currentOrgId, inviteEmail, inviteRole)
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      loadTeam() // Refresh list
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await revokeInvitation(currentOrgId, inviteId)
      toast.success('Invitation revoked')
      loadTeam() // Refresh list
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke invitation')
    }
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-12">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Organization Settings</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage your team workspace.</p>
      </div>

      {/* Team Members Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium text-neutral-900 dark:text-white">Team Members</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage who has access to this organization.</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
          {/* Invite Form */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <form onSubmit={handleSendInvite} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-500 mb-1">Email Address</label>
                <Input 
                  type="email" 
                  placeholder="colleague@company.com" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-neutral-500 mb-1">Role</label>
                <select 
                  className="w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <Button type="submit" disabled={isInviting} isLoading={isInviting}>
                Invite
              </Button>
            </form>
          </div>

          {/* Members List */}
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {isLoadingTeam ? (
              <div className="p-8 text-center text-neutral-500">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">No members found (this shouldn't happen).</div>
            ) : (
              members.map((member) => (
                <div key={member.user_id} className="p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
                      {member.user_email?.[0].toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">
                        {member.user_email || 'Unknown User'}
                      </div>
                      <div className="text-xs text-neutral-500">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-400 capitalize">
                      {member.role}
                    </span>
                    {/* Placeholder for future member actions (remove, change role) */}
                    {/* Only show remove if not self and has permission */}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-neutral-900 dark:text-white">Pending Invitations</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">People invited to join your team.</p>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-800">
            {invitations.map((invite) => (
              <div key={invite.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                    <div className="animate-pulse w-2 h-2 rounded-full bg-neutral-400"></div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-900 dark:text-white">
                      {invite.email}
                    </div>
                    <div className="text-xs text-neutral-500">
                      Invited as <span className="capitalize">{invite.role}</span> • Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => handleRevokeInvite(invite.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="space-y-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
        <div>
            <h2 className="text-lg font-medium text-red-600 dark:text-red-500 mb-1">Danger Zone</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Irreversible actions for this organization.</p>
        </div>

        <div className="p-4 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 rounded-xl flex items-center justify-between">
            <div>
                <h3 className="font-medium text-red-900 dark:text-red-200">Delete Organization</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">Permanently delete this organization and all its data.</p>
            </div>
            <button
                onClick={() => setShowDeletePrompt(true)}
                className="px-4 py-2 bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
            >
                Delete Organization
            </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeletePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-neutral-200 dark:border-neutral-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Delete Organization?</h3>
            </div>
            
            <p className="text-neutral-600 dark:text-neutral-300 mb-6">
              This action cannot be undone. This will permanently delete the organization, all stored files, and remove all members.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">
                  Type <span className="font-bold text-neutral-900 dark:text-white">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border-none rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-neutral-900 dark:text-white font-mono"
                  placeholder="DELETE"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDeletePrompt(false)
                    setDeleteConfirm('')
                  }}
                  className="flex-1 px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors font-medium"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirm !== 'DELETE' || isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Organization'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
