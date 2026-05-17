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

  // Build the response early so we can attach refreshed cookies to it
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          // 1. Try standard project-specific cookie
          const standardCookie = request.cookies.get(name)?.value
          if (standardCookie) return standardCookie

          // 2. Try generic mobile sync cookie (fallback)
          const generic = request.cookies.get('sb-auth-token')?.value
          if (generic) return generic

          return undefined
        },
        // IMPORTANT: These must write to the response so the refreshed
        // session token is forwarded to the browser on every request.
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Always call getUser (not getSession) — this refreshes the token if needed
  const { data: { user } } = await supabase.auth.getUser()

  if (!isPublic) {
    // No user → redirect to login
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check 12-hour timeout from last sign in
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const lastSignIn = new Date(session.user.last_sign_in_at ?? 0).getTime()
      const now = Date.now()

      if (now - lastSignIn > SESSION_TIMEOUT_MS) {
        const timeoutResponse = NextResponse.redirect(new URL('/login?reason=timeout', request.url))
        // Clear all supabase cookies (SSR uses sb-<project-ref>-auth-token pattern)
        request.cookies.getAll().forEach(cookie => {
          if (cookie.name.startsWith('sb-')) {
            timeoutResponse.cookies.delete(cookie.name)
          }
        })
        return timeoutResponse
      }
    }
  }

  // Security headers
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