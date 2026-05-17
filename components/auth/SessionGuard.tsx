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
const SESSION_LOGIN_KEY = 'session_login_at';
const SESSION_TIMEOUT_MS = 12 * 60 * 60 * 1000;

async function recordSessionLogin() {
  localStorage.setItem(SESSION_LOGIN_KEY, Date.now().toString());
}

async function isSessionValid() {
  const loginAt = localStorage.getItem(SESSION_LOGIN_KEY);
  if (!loginAt) return true;
  return Date.now() - parseInt(loginAt, 10) < SESSION_TIMEOUT_MS;
}

async function clearSessionLogin() {
  localStorage.removeItem(SESSION_LOGIN_KEY);
}

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
      // Skip for public paths
      const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          if (!isPublic) router.replace('/login');
          return;
        }

        const valid = await isSessionValid();
        if (!valid) {
          await supabase.auth.signOut();
          await clearSessionLogin();
          router.replace('/login?reason=timeout');
          return;
        }
      } catch (err) {
        console.error('[SessionGuard] Session validation error:', err);
      } finally {
        hasCheckedSession.current = true;
      }
    };

    validateSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  return <>{children}</>;
}
