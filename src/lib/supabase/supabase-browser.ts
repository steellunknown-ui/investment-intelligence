import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
    const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                // Use localStorage on mobile to prevent PKCE state loss during app-switching
                storage: isCapacitor ? window.localStorage : undefined,
                persistSession: true,
                detectSessionInUrl: true,
                flowType: 'pkce',
            }
        }
    )
}
