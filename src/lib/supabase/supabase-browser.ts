import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
    const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: true,
                detectSessionInUrl: true,
                flowType: 'pkce',
            }
        }
    )
}
