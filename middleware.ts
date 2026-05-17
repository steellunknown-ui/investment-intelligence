import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const SESSION_TIMEOUT_MS = 12 * 60 * 60 * 1000 // 12 hours

const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/auth', '/nominee-portal', '/nominee-access', '/api/health', '/more']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isApi = pathname.startsWith('/api/')

  if (isApi) {
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
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

  const { data: { user } } = await supabase.auth.getUser()

  if (!isPublic) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const lastSignIn = new Date(session.user.last_sign_in_at ?? 0).getTime()
      if (Date.now() - lastSignIn > SESSION_TIMEOUT_MS) {
        const timeoutResponse = NextResponse.redirect(new URL('/login?reason=timeout', request.url))
        request.cookies.getAll().forEach(cookie => {
          if (cookie.name.startsWith('sb-')) {
            timeoutResponse.cookies.delete(cookie.name)
          }
        })
        return timeoutResponse
      }
    }
  }

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
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
