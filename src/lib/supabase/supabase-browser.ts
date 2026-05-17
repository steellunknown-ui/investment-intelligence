/**
 * Supabase Browser Client — Capacitor-Aware Singleton
 * 
 * This creates a single Supabase client for all client-side usage.
 * 
 * Key design decisions:
 * 1. SINGLETON: Only one GoTrue client instance exists at a time.
 *    Multiple clients cause race conditions with token refresh.
 * 2. NATIVE STORAGE: When running in Capacitor, auth tokens are stored
 *    in Android SharedPreferences (via capacitorStorage), which survives
 *    app process kills. This is the fix for sessions being lost.
 * 3. PKCE FIX: detectSessionInUrl is disabled in Capacitor because
 *    the OAuth callback is handled via deep links, not URL fragments.
 */

import { createBrowserClient } from '@supabase/ssr'
import { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { capacitorStorage } from './capacitor-storage'

const isCapacitorNative = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
};

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

function serializeSessionForCookie(session: Session) {
  return encodeURIComponent(JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  }));
}

export function createSupabaseBrowserClient() {
  // Singleton — reuse existing client
  if (cachedClient) return cachedClient;

  const isNative = isCapacitorNative();

  cachedClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        // In Capacitor, we handle the OAuth redirect via deep links ourselves.
        // Disabling this prevents the client from trying to parse URL fragments
        // that don't exist in the WebView context after a deep link.
        detectSessionInUrl: !isNative,
        flowType: 'pkce',
        // Use native persistent storage in Capacitor
        // This is the key fix — SharedPreferences survives app kills
        ...(isNative ? {
          storage: capacitorStorage,
          storageKey: 'sb-auth-token', // Keep consistent with SSR expectations
        } : {}),
      }
    }
  );

  // ── Native Cookie Sync (Hardened) ──
  // Next.js API routes rely on cookies. We must mirror the native session
  // into document.cookie so that fetch() requests include the auth token.
  if (isNative) {
    cachedClient.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log(`🚀 [AUTH] State Change: ${event}`);
      if (session) {
        const cookieValue = serializeSessionForCookie(session);

        // 1. Webview JS Sync
        document.cookie = `sb-auth-token=${cookieValue}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

        // 2. Native OS Cookie Sync (Most Powerful)
        try {
          const { CapacitorCookies } = await import('@capacitor/core');
          await CapacitorCookies.setCookie({
            url: 'https://investment-intellegince.vercel.app',
            key: 'sb-auth-token',
            value: cookieValue,
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString(),
            path: '/',
          });
          console.log('✅ [AUTH] Native OS Cookie Synced');
        } catch (e) {
          console.warn('⚠️ [AUTH] Native OS Cookie sync failed:', e);
        }
      } else if (event === 'SIGNED_OUT') {
        document.cookie = 'sb-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    });
  }

  return cachedClient;
}

/**
 * Resets the cached client. Only needed when clearing session for logout.
 */
export function resetSupabaseBrowserClient() {
  cachedClient = null;
}
