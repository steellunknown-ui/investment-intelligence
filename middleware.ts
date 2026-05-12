import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const SESSION_TIMEOUT_MS = 12 * 60 * 60 * 1000 // 12 hours

const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/auth', '/nominee-portal', '/nominee-access', '/api/health', '/more']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  // Handle CORS for API routes
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
  }

  if (!isPublic) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) { return request.cookies.get(name)?.value },
          set() {},
          remove() {},
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()

    // No session → redirect to login
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check 12 hour timeout from last sign in
    const lastSignIn = new Date(session.user.last_sign_in_at ?? 0).getTime()
    const now = Date.now()

    if (now - lastSignIn > SESSION_TIMEOUT_MS) {
      const response = NextResponse.redirect(new URL('/login?reason=timeout', request.url))
      // Clear session cookies
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      return response
    }
  }

  // Security headers
  const response = NextResponse.next()
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https://lh3.googleusercontent.com https://*.supabase.co blob:; " +
    "connect-src 'self' https://rmzgzczmrbooegftrzxn.supabase.co wss://rmzgzczmrbooegftrzxn.supabase.co;"
  )
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}