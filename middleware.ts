import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/signup',
  '/auth/callback',
  '/auth/verify',
  '/invite/accept',
  '/about',
  '/faq',
])

const PUBLIC_PREFIXES = [
  '/request/',
  '/share/',
]

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

// * [shareId] pattern – e.g. /abc123 for file share links (single segment, not a reserved path)
const RESERVED_PATHS = new Set(['dashboard', 'login', 'signup', 'about', 'faq', 'auth', 'invite', 'request', 'settings', 'security', 'org-settings'])
function isShareIdRoute(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean)
  return segments.length === 1 && !RESERVED_PATHS.has(segments[0])
}

const AUTH_ONLY_ROUTES = new Set(['/login', '/signup'])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const hasAccess = request.cookies.has('access_token')
  const hasRefresh = request.cookies.has('refresh_token')
  const hasSession = hasAccess || hasRefresh

  if (hasAccess && AUTH_ONLY_ROUTES.has(pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (isPublicRoute(pathname) || isShareIdRoute(pathname)) {
    return NextResponse.next()
  }

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|.*\\.png$|.*\\.svg$|.*\\.ico$|api/).*)',
  ],
}
