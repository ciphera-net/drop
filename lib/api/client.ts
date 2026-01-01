/**
 * HTTP client wrapper for API calls
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

/**
 * Base API client with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}/api/v1${endpoint}`
  
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
    // * Handle 401 specifically?
    if (response.status === 401) {
       // Optional: Redirect to login or clear token?
       // localStorage.removeItem('token')
    }

    const error = await response.json().catch(() => ({
      error: 'Unknown error',
      message: `HTTP ${response.status}: ${response.statusText}`,
    }))
    throw new Error(error.message || error.error || 'Request failed')
  }

  return response.json()
}

export default apiRequest
