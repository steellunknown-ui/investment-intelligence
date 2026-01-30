import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = [
    '/dashboard',
    '/assistant',
    '/holdings',
    '/nominees',
    '/nominee', // Needs to cover /nominee and /nominees if both exist
    '/insurance',
    '/banking',
    '/assets',
    '/liabilities',
    '/receivables',
    '/belongings',
    '/documents',
    '/activity',
    '/settings',
]

const AUTH_ROUTES = [
    '/login',
    '/signup'
]

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Create response to pass to supabase client
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // 2. Refresh session if needed
    const { data: { user } } = await supabase.auth.getUser()

    // 3. Logic for Protected Routes
    const isProtectedRoute = PROTECTED_ROUTES.some(
        route => pathname === route || pathname.startsWith(`${route}/`)
    )

    if (isProtectedRoute && !user) {
        // Redirect to login with next param
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('next', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // 4. Logic for Auth Routes (Login/Signup) when already logged in
    const isAuthRoute = AUTH_ROUTES.some(
        route => pathname === route
    )

    if (isAuthRoute && user) {
        // Redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder content (if your folders map to standard public assets)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
