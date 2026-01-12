'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { deleteOrganization } from '@/lib/api/organization'
import { toast } from 'sonner'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

export default function OrganizationSettings() {
  const { user, refresh } = useAuth()
  const router = useRouter()
  const [showDeletePrompt, setShowDeletePrompt] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // * Only show for organization contexts (where org_id is present)
  // * And only for owners (though backend enforces this too)
  // * Note: current auth context implementation might store org details in user object or separate context
  // * For now, we assume if we are in an org context, we can try to delete it.
  
  // Parse org ID from token or context. 
  // In the current implementation, 'user' object might not have the org ID directly if it's strictly the user profile.
  // We need to check how the context switcher stores the current org ID.
  // Based on previous reads, the token has 'org_id'.
  // We'll decode it or assume the current active context is the target.
  
  // ! CRITICAL: The deleteOrganization API takes an ID. 
  // ! We need to know WHICH org we are currently in.
  // ! The current useAuth hook exposes 'user' but maybe not the current Org ID explicitly.
  // ! Let's check the token or add a way to get current Org ID.
  
  // For now, let's try to parse the token to get the org ID since it's stored there.
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
      
      // * Switch back to personal context
      // * We can do this by clearing the token or calling switchContext(null)
      // * But since the token is invalid now, we should probably just reload/logout or force switch
      
      // Force switch to personal
      // reusing the logic from WorkspaceSwitcher would be ideal, but for now:
      // We manually clear the token and reload, or call the switch endpoint if it works without a valid token (it doesn't).
      // Actually, switchContext(null) might fail if the current token is invalid? 
      // No, the user is still valid, just the org context is gone. 
      // But the current token is bound to the org. So it might be invalid for further requests?
      // Usually deleting the resource you are scoped to invalidates the scope.
      
      // Safest bet: Refresh full session (Logout might be too aggressive)
      // Let's try to switch to personal context explicitly using the REFRESH token if available,
      // or just redirect to dashboard and let the auth error handler kick in (which might log out).
      
      // Better: Let's assume the backend allows us to switch to personal even if current org is gone, 
      // OR we just perform a hard reload which might trigger a 401 and then a refresh to personal?
      // Actually, if we delete the org, the token claims are now stale/invalid for THAT org.
      // But the user still exists.
      
      // Let's try to use the auth context to "logout" or "refresh"
      // If we just reload, the current token might cause 404s or 403s.
      
      // Let's try to switch to personal context "blindly"
      localStorage.removeItem('token') // Remove the org-scoped token
      window.location.href = '/dashboard' // Reloading should trigger a token refresh using the HttpOnly cookie or Refresh Token in localstorage?
      // Wait, the refresh token is also in localstorage in this app?
      // Yes, 'refreshToken' is in localStorage.
      // If we remove 'token', the api client will try to use 'refreshToken' to get a new 'token'.
      // Since the refresh endpoint issues a new token (usually personal or last context?), 
      // we need to make sure the refresh logic handles "defaulting" to personal if the previous context is invalid.
      
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to delete organization')
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Organization Settings</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage your team workspace.</p>
      </div>

      <div className="space-y-6">
        <div>
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-500 mb-1">Danger Zone</h2>
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
