/**
 * SessionGuard — Client-side session persistence & 12-hour timeout enforcement
 * 
 * This component wraps the DashboardShell and handles:
 * 1. On app launch (mount): Restores session from native storage
 * 2. On app resume (Capacitor appStateChange): Re-validates session
 * 3. 12-hour timeout: Checks login timestamp and redirects if expired
 * 4. Auth state listener: Records login timestamps on sign-in events
 * 
 * This runs ONLY on the client side and complements the server-side
 * middleware checks. Together they provide a bulletproof 12-hour session.
 */

"use client";

import { useEffect, useRef, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/supabase-browser";
import {
  recordSessionLogin,
  isSessionValid,
  clearSessionLogin,
} from "@/src/lib/supabase/capacitor-storage";

const isCapacitorNative = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
};

// Paths that don't need session validation
const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/auth', '/nominee-portal', '/nominee-access', '/more'];

interface SessionGuardProps {
  children: ReactNode;
}

export function SessionGuard({ children }: SessionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    if (!isCapacitorNative() || typeof window === 'undefined') return;

    const patchKey = '__investmentIntelligenceAuthFetch';
    if ((window as any)[patchKey]) return;

    const originalFetch = window.fetch.bind(window);
    (window as any)[patchKey] = { originalFetch };

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      const url = new URL(requestUrl, window.location.origin);
      const isSameOriginApi = url.origin === window.location.origin && url.pathname.startsWith('/api/');
      const isPublicAuthApi =
        url.pathname === '/api/auth/native-exchange' ||
        url.pathname === '/api/health';

      if (!isSameOriginApi || isPublicAuthApi) {
        return originalFetch(input, init);
      }

      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));

      if (!headers.has('Authorization')) {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
          headers.set('Authorization', `Bearer ${session.access_token}`);
        }
      }

      return originalFetch(input, {
        ...init,
        credentials: init?.credentials ?? 'include',
        headers,
      });
    };

    return () => {
      const patch = (window as any)[patchKey];
      if (patch?.originalFetch === originalFetch) {
        window.fetch = originalFetch;
        delete (window as any)[patchKey];
      }
    };
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // ── 1. Listen for auth state changes ──
    // When user signs in, record the login timestamp
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session) {
          await recordSessionLogin();
        }
        if (event === 'SIGNED_OUT') {
          await clearSessionLogin();
        }
      }
    );

    // ── 2. On mount: validate existing session ──
    const validateSession = async () => {
      // ── CHECK THE LOGIN LOCK ──
      // If the app is currently processing a deep link login,
      // STOP the guard from redirecting.
      if (typeof window !== 'undefined' && (window as any).isAuthenticating) {
        console.log('[SessionGuard] Auth in progress, skipping guard');
        return;
      }

      // Skip for public paths
      const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

      try {
        // Check if we have a valid session in Supabase
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // No session — redirect to login if not on a public path
          if (!isPublic) {
            router.replace('/login');
          }
          return;
        }

        // Check 12-hour client-side timeout
        const valid = await isSessionValid();
        if (!valid) {
          // Session exists but 12-hour window expired
          await supabase.auth.signOut();
          await clearSessionLogin();
          router.replace('/login?reason=timeout');
          return;
        }

        // Session is valid — if this is the first check on a native app,
        // and user is on root/login, redirect to dashboard
        if (!hasCheckedSession.current && isCapacitorNative()) {
          if (pathname === '/' || pathname === '/login') {
            router.replace('/dashboard');
          }
        }
      } catch (err) {
        console.error('[SessionGuard] Session validation error:', err);
      } finally {
        hasCheckedSession.current = true;
      }
    };

    validateSession();

    // ── 3. Capacitor: Listen for app resume events ──
    let appStateCleanup: (() => void) | null = null;

    if (isCapacitorNative()) {
      const setupAppStateListener = async () => {
        try {
          const { App } = await import('@capacitor/app');

          const listener = await App.addListener('appStateChange', async (state) => {
            if (state.isActive) {
              // App came to foreground — re-validate session
              const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
              if (isPublic) return;

              const valid = await isSessionValid();
              if (!valid) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                  // Session exists but 12-hour expired
                  await supabase.auth.signOut();
                  await clearSessionLogin();
                  router.replace('/login?reason=timeout');
                }
              }
            }
          });

          appStateCleanup = () => {
            listener.remove();
          };
        } catch (err) {
          console.error('[SessionGuard] Failed to setup app state listener:', err);
        }
      };

      setupAppStateListener();
    }

    return () => {
      subscription.unsubscribe();
      if (appStateCleanup) appStateCleanup();
    };
  }, [router, pathname]);

  return <>{children}</>;
}
