/**
 * HTTP client wrapper for API calls
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
export const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:8081'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/**
 * Base API client with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // * Determine base URL
  const isAuthRequest = endpoint.startsWith('/auth')
  const baseUrl = isAuthRequest ? AUTH_URL : API_URL
  const url = `${baseUrl}/api/v1${endpoint}`
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Inject Auth Token if available (Client-side only)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      (headers as any)['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      // * Attempt Token Refresh if 401
      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refreshToken')
        
        // * Prevent infinite loop: Don't refresh if the failed request WAS a refresh request
        if (refreshToken && !endpoint.includes('/auth/refresh')) {
          try {
            // * Get active org ID to preserve context
            const activeOrgId = localStorage.getItem('active_org_id')
            
            const refreshRes = await fetch(`${AUTH_URL}/api/v1/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  refresh_token: refreshToken,
                  organization_id: activeOrgId || undefined
              }),
            })

            if (refreshRes.ok) {
              const data = await refreshRes.json()
              localStorage.setItem('token', data.access_token)
              localStorage.setItem('refreshToken', data.refresh_token) // Rotation

              // * Retry original request with new token
              const newHeaders = {
                ...headers,
                'Authorization': `Bearer ${data.access_token}`,
              }
              const retryResponse = await fetch(url, {
                ...options,
                headers: newHeaders,
              })
              
              if (retryResponse.ok) {
                return retryResponse.json()
              }
            } else {
              // * Refresh failed, logout
              localStorage.removeItem('token')
              localStorage.removeItem('refreshToken')
              localStorage.removeItem('user')
              // Don't auto-redirect here, let the caller handle the 401 if they want, 
              // or we can redirect. But throwing 401 allows component to decide (e.g. save return URL)
              // window.location.href = '/login' 
              // actually, throwing ApiError(401) is better than redirecting blindly
            }
          } catch (e) {
            // * Network error during refresh or logout
            throw e
          }
        }
      }
    }

    const errorBody = await response.json().catch(() => ({
      error: 'Unknown error',
      message: `HTTP ${response.status}: ${response.statusText}`,
    }))
    throw new ApiError(errorBody.message || errorBody.error || 'Request failed', response.status)
  }

  return response.json()
}

export const authFetch = apiRequest
export default apiRequest
