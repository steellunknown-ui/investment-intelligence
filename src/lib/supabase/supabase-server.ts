import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies, headers } from 'next/headers'

export function createSupabaseServerClient() {
    const cookieStore = cookies()
    const headerStore = headers()

    // 1. Try Authorization Header (Standard for Mobile APIs)
    const authHeader = headerStore.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
        return createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false,
                },
                global: {
                    headers: {
                        Authorization: authHeader,
                    },
                },
            }
        )
    }

    // 2. Fall back to cookie-based SSR client
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    // Try standard project-specific cookie
                    const standardCookie = cookieStore.get(name)?.value
                    if (standardCookie) return standardCookie

                    // Try generic mobile sync cookie (fallback)
                    const generic = cookieStore.get('sb-auth-token')?.value
                    if (generic) {
                        try {
                            const decoded = decodeURIComponent(generic)
                            const session = JSON.parse(decoded)
                            if (session && typeof session === 'object') {
                                if (name.endsWith('.0')) return session.access_token || undefined
                                if (name.endsWith('.1')) return session.refresh_token || undefined
                                if (name.endsWith('.expires-at')) return session.expires_at?.toString() || undefined
                                if (!name.includes('.')) return session.access_token || undefined
                            }
                        } catch (e) {
                            console.error('[SERVER COOKIE FALLBACK ERROR] Failed to parse generic cookie:', e)
                        }
                    }

                    return undefined
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch {
                        // Server component - can't set cookies
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options })
                    } catch {
                        // Server component - can't remove cookies
                    }
                },
            },
        }
    )
}

