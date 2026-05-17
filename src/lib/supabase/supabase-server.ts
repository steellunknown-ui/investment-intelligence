import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

export function createSupabaseServerClient() {
    const cookieStore = cookies()
    const headerStore = headers()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    // 1. Try standard project-specific cookie
                    const standardCookie = cookieStore.get(name)?.value
                    if (standardCookie) return standardCookie

                    // 2. Try generic mobile sync cookie (fallback)
                    if (name.startsWith('sb-') && name.endsWith('-auth-token')) {
                        const generic = cookieStore.get('sb-auth-token')?.value
                        if (generic) return generic
                    }

                    // 3. Try Authorization Header (Standard for Mobile APIs)
                    const authHeader = headerStore.get('Authorization')
                    if (authHeader?.startsWith('Bearer ')) {
                        const token = authHeader.split(' ')[1]
                        // Supabase SSR expects a JSON string of the session in the 'get' return
                        // but it can also handle a raw access token if we wrap it correctly.
                        // However, just returning the token here is the safest bridge.
                        return token
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
