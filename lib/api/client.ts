/**
 * HTTP client wrapper for API calls
 * Includes Request ID propagation for debugging across services
 */

import { authMessageFromStatus, AUTH_ERROR_MESSAGES } from '@ciphera-net/ui'
import { generateRequestId, getRequestIdHeader, setLastRequestId } from '@/lib/utils/requestId'

/** Request timeout in ms; network errors surface as user-facing "Network error, please try again." */
const FETCH_TIMEOUT_MS = 30_000

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
export const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
export const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8081'

export function getLoginUrl(redirectPath = '/auth/callback') {
  const redirectUri = encodeURIComponent(`${APP_URL}${redirectPath}`)
  return `${AUTH_URL}/login?client_id=drop-app&redirect_uri=${redirectUri}&response_type=code`
}

export function getSignupUrl(redirectPath = '/auth/callback') {
  const redirectUri = encodeURIComponent(`${APP_URL}${redirectPath}`)
  return `${AUTH_URL}/signup?client_id=drop-app&redirect_uri=${redirectUri}&response_type=code`
}

export class ApiError extends Error {
  status: number
  data?: Record<string, unknown>

  constructor(message: string, status: number, data?: Record<string, unknown>) {
    super(message)
    this.status = status
    this.data = data
  }
}

// * Mutex for token refresh
let isRefreshing = false
type RefreshSubscriber = { onSuccess: () => void; onFailure: (err: unknown) => void }
let refreshSubscribers: RefreshSubscriber[] = []

function subscribeToTokenRefresh(onSuccess: () => void, onFailure: (err: unknown) => void) {
  refreshSubscribers.push({ onSuccess, onFailure })
}

function onRefreshed() {
  refreshSubscribers.forEach((s) => s.onSuccess())
  refreshSubscribers = []
}

function onRefreshFailed(err: unknown) {
  refreshSubscribers.forEach((s) => {
    try {
      s.onFailure(err)
    } catch {
      // ignore
    }
  })
  refreshSubscribers = []
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
  const baseUrl = isAuthRequest ? AUTH_API_URL : API_URL
  const url = `${baseUrl}/api/v1${endpoint}`

  // * Generate and store request ID for tracing
  const requestId = generateRequestId()
  setLastRequestId(requestId)

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    [getRequestIdHeader()]: requestId,
    ...options.headers,
  }

  // * Rely on HttpOnly cookies; no manual Authorization header.
  // * credentials: 'include' sends cookies cross-origin (same site in prod: .ciphera.net; localhost in dev).

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  const signal = options.signal ?? controller.signal

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      signal,
    })
    clearTimeout(timeoutId)
  } catch (e) {
    clearTimeout(timeoutId)
    if (e instanceof Error && (e.name === 'AbortError' || e.name === 'TypeError')) {
      throw new ApiError(AUTH_ERROR_MESSAGES.NETWORK, 0)
    }
    throw e
  }

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        if (!endpoint.includes('/auth/refresh')) {
          if (isRefreshing) {
            return new Promise<T>((resolve, reject) => {
              subscribeToTokenRefresh(
                async () => {
                  try {
                    const retryResponse = await fetch(url, {
                      ...options,
                      headers,
                      credentials: 'include',
                    })
                    if (retryResponse.ok) {
                      resolve(await retryResponse.json())
                    } else {
                      reject(new ApiError(authMessageFromStatus(retryResponse.status), retryResponse.status))
                    }
                  } catch (e) {
                    reject(e)
                  }
                },
                (err) => reject(err)
              )
            })
          }

          isRefreshing = true

          try {
            const refreshRes = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            })

            if (refreshRes.ok) {
              onRefreshed()
              const retryResponse = await fetch(url, {
                ...options,
                headers,
                credentials: 'include',
              })
              if (retryResponse.ok) {
                return retryResponse.json()
              }
            } else {
              const sessionExpiredMsg = authMessageFromStatus(401)
              onRefreshFailed(new ApiError(sessionExpiredMsg, 401))
              localStorage.removeItem('user')
            }
          } catch (e) {
            const err = e instanceof Error && (e.name === 'AbortError' || e.name === 'TypeError')
              ? new ApiError(AUTH_ERROR_MESSAGES.NETWORK, 0)
              : e
            onRefreshFailed(err)
            throw err
          } finally {
            isRefreshing = false
          }
        }
      }
    }

    const errorBody = await response.json().catch(() => ({}))
    const message = authMessageFromStatus(response.status)
    throw new ApiError(message, response.status, errorBody)
  }

  return response.json()
}

export const authFetch = apiRequest
export default apiRequest
