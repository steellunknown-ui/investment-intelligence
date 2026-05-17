"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/supabase-browser";
import {
    recordSessionLogin,
    isSessionValid,
    warmupStorage,
    capacitorStorage
} from "@/src/lib/supabase/capacitor-storage";
import { createCapacitorAuthClient } from '@/src/lib/supabase/capacitor-auth';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
    TrendingUp,
    Shield,
    Users,
    Eye,
    EyeOff,
    ArrowRight,
    Sparkles
} from "lucide-react";

// Detect if running inside Capacitor (Android/iOS native app)
const isCapacitorNative = (): boolean => {
    return typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
};

const PROD_URL = 'https://investment-intellegince.vercel.app';
const AUTH_STORAGE_KEY = 'sb-auth-token';
const CODE_VERIFIER_KEY = `${AUTH_STORAGE_KEY}-code-verifier`;

// In-memory fallback for PKCE verifier (survives within same JS context)
let inMemoryVerifier: string | null = null;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
        if (timeoutId) clearTimeout(timeoutId);
    }) as Promise<T>;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number, message: string) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(input, {
            ...init,
            signal: controller.signal,
        });
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            throw new Error(message);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

function createCodeVerifier() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const length = 64;

    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, (byte) => chars[byte % chars.length]).join('');
    }

    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function base64UrlEncode(bytes: Uint8Array) {
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createCodeChallenge(verifier: string) {
    if (
        typeof crypto === 'undefined' ||
        !crypto.subtle ||
        typeof TextEncoder === 'undefined'
    ) {
        return { challenge: verifier, method: 'plain' };
    }

    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return { challenge: base64UrlEncode(new Uint8Array(digest)), method: 's256' };
}

async function createNativeGoogleOAuthUrl(redirectTo: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
        throw new Error('Missing Supabase URL');
    }

    const verifier = createCodeVerifier();
    console.log('🛡️ [AUTH] Generated PKCE Verifier');

    // 1. Always keep in memory (fastest)
    inMemoryVerifier = verifier;

    // 2. localStorage backup (sync)
    try { localStorage.setItem(CODE_VERIFIER_KEY, verifier); } catch {}

    // 3. Native Preferences (AWAIT this one to be safe)
    console.log('💾 [AUTH] Saving verifier to native storage...');
    await withTimeout(
        capacitorStorage.setItem(CODE_VERIFIER_KEY, verifier),
        2500,
        'Native storage save timed out'
    ).catch((e) => console.warn('⚠️ [AUTH] Native save warning:', e));

    const { challenge, method } = await createCodeChallenge(verifier);
    const url = new URL(`${supabaseUrl}/auth/v1/authorize`);
    url.searchParams.set('provider', 'google');
    url.searchParams.set('redirect_to', redirectTo);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', method);

    return url.toString();
}

async function getStoredCodeVerifier() {
    // 1. In-memory (fastest, same JS context — works if app wasn't killed)
    if (inMemoryVerifier) return inMemoryVerifier;

    // 2. localStorage (survives soft reloads)
    const localVerifier = localStorage.getItem(CODE_VERIFIER_KEY);
    if (localVerifier) return localVerifier;

    // 3. Native Preferences (survives app kills / WebView hard reloads)
    const nativeVerifier = await withTimeout(
        capacitorStorage.getItem(CODE_VERIFIER_KEY),
        4000,
        'Reading login verifier timed out'
    ).catch(() => null);

    return nativeVerifier || '';
}

async function exchangeNativeCodeForSession(authCode: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase auth config');
    }

    const codeVerifier = await getStoredCodeVerifier();
    if (!codeVerifier) {
        throw new Error('Login verifier missing. Please tap Continue with Google again.');
    }

    const response = await fetchWithTimeout(
        `${PROD_URL}/api/auth/native-exchange`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer native-oauth-exchange',
            },
            body: JSON.stringify({
                code: authCode,
                codeVerifier,
            }),
        },
        12000,
        'Google login handshake timed out'
    );

    const payload = await withTimeout(
        response.json().catch(() => ({})),
        5000,
        'Reading Google login response timed out'
    );

    if (!response.ok) {
        throw new Error(payload.error_description || payload.msg || payload.error || 'Google login handshake failed');
    }

    if (!payload.session?.access_token || !payload.session?.refresh_token || !payload.session?.user) {
        throw new Error('Google login did not return a valid session');
    }

    localStorage.removeItem(CODE_VERIFIER_KEY);
    inMemoryVerifier = null;
    await capacitorStorage.removeItem(CODE_VERIFIER_KEY).catch(() => {});

    return { session: payload.session, user: payload.user };
}

async function persistNativeSession(session: any) {
    const sessionJson = JSON.stringify(session);
    localStorage.setItem(AUTH_STORAGE_KEY, sessionJson);
    await capacitorStorage.setItem(AUTH_STORAGE_KEY, sessionJson);

    const cookieValue = encodeURIComponent(JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
    }));
    document.cookie = `sb-auth-token=${cookieValue}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

    const capacitorAuth = createCapacitorAuthClient();
    await withTimeout(
        capacitorAuth.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
        }),
        5000,
        'Saving native session timed out'
    ).catch((err) => {
        console.error('[AUTH] Capacitor session save failed:', err);
    });

    const ssrClient = createSupabaseBrowserClient();
    await withTimeout(
        ssrClient.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
        }),
        5000,
        'Saving browser session timed out'
    ).catch((err) => {
        console.error('[AUTH] Browser session save failed:', err);
    });
}

function TimeoutMessage({ setError }: { setError: (msg: string | null) => void }) {
    const searchParams = useSearchParams();
    useEffect(() => {
        if (searchParams.get('reason') === 'timeout') {
            setError('Your session has expired after 12 hours. Please sign in again.');
        }
    }, [searchParams, setError]);
    return null;
}

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [checkingSession, setCheckingSession] = useState(true);
    const processedOAuthCodeRef = useRef<string | null>(null);

    // ── On mount: Check for existing valid session ──
    useEffect(() => {
        const checkExistingSession = async () => {
            try {
                const supabase = createSupabaseBrowserClient();
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    const valid = await isSessionValid();
                    if (valid) {
                        router.replace('/dashboard');
                        return;
                    }
                    await supabase.auth.signOut();
                }
            } catch (err) {
                console.error('[Login] Session check error:', err);
            } finally {
                setCheckingSession(false);
            }
        };

        checkExistingSession();
    }, [router]);

    // Capacitor deep link listener
    useEffect(() => {
        let isMounted = true;
        let listenerHandle: { remove: () => Promise<void> | void } | null = null;

        const handleDeepLink = async (incomingUrl: string) => {
            console.log('🚀 [DEEP LINK] Incoming:', incomingUrl);

            try {
                const url = new URL(incomingUrl);

                // 1. Close browser window
                try {
                    const { Browser } = await import('@capacitor/browser');
                    await Browser.close();
                } catch (e) {}

                const code = url.searchParams.get('code');

                if (code && isMounted) {
                    console.log('✅ [DEEP LINK] Found code, starting handshake');
                    // Prevent duplicate runs
                    if (processedOAuthCodeRef.current === code) {
                        console.log('⚠️ [DEEP LINK] Code already processed');
                        return;
                    }
                    processedOAuthCodeRef.current = code;

                    setLoading(true);
                    setStatusMessage("Finalizing handshake...");
                    setError(null);

                    try {
                        console.log('🤝 [AUTH] Exchanging code locally...');
                        const capacitorAuth = createCapacitorAuthClient();
                        const { data: exchangeData, error: exchangeError } = await capacitorAuth.auth.exchangeCodeForSession(code);

                        if (exchangeError) throw exchangeError;
                        if (!exchangeData.session) throw new Error("Authentication returned no session");

                        setStatusMessage("Synchronizing...");
                        const session = exchangeData.session;

                        // Force sync to SSR Client
                        const ssrClient = createSupabaseBrowserClient();
                        await ssrClient.auth.setSession({
                            access_token: session.access_token,
                            refresh_token: session.refresh_token,
                        });

                        // Force sync to Cookies (Critical for Dashboard API)
                        const cookieValue = encodeURIComponent(JSON.stringify({
                            access_token: session.access_token,
                            refresh_token: session.refresh_token,
                        }));
                        document.cookie = `sb-auth-token=${cookieValue}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax; domain=.vercel.app`;
                        document.cookie = `sb-auth-token=${cookieValue}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

                        await recordSessionLogin();

                        setStatusMessage("Success! Entering dashboard...");

                        // Push to dashboard
                        router.push('/dashboard');

                        // FAILSAFE: Hard redirect if Next.js router is stuck
                        setTimeout(() => {
                            if (window.location.pathname !== '/dashboard') {
                                window.location.href = '/dashboard';
                            }
                        }, 1500);

                    } catch (err: any) {
                        console.error('❌ [AUTH] Handshake failed:', err);
                        setError('Handshake failed: ' + (err.message || 'connection error'));
                        setStatusMessage(null);
                        processedOAuthCodeRef.current = null;
                    } finally {
                        if (isMounted) setLoading(false);
                    }
                    return;
                }
            } catch (urlErr) {
                console.error('[Login] Deep link parse error:', urlErr);
            }
        };

        const setupDeepLinkListener = async () => {
            if (!isCapacitorNative()) return;

            try {
                const { App } = await import('@capacitor/app');

                // Check for cold-start (App was closed)
                const launchUrl = await App.getLaunchUrl();
                if (launchUrl?.url) {
                    console.log('🚀 [LAUNCH] App started with deep link');
                    void handleDeepLink(launchUrl.url);
                }

                // Listen for warm-start (App was in background)
                listenerHandle = await App.addListener('appUrlOpen', (data: any) => {
                    console.log('🚀 [EVENT] App received deep link while running');
                    void handleDeepLink(data.url);
                });
            } catch (err) {
                console.error('[Login] Capacitor App plugin failed:', err);
            }
        };

        setupDeepLinkListener();

        return () => {
            isMounted = false;
            if (listenerHandle) {
                void listenerHandle.remove();
            }
        };
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        setStatusMessage(null);

        try {
            const supabase = createSupabaseBrowserClient();
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
                return;
            }

            await recordSessionLogin();
            router.push("/dashboard");
            router.refresh();
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            setError(null);
            setStatusMessage("Redirecting to Google...");

            const origin = typeof window !== 'undefined' ? window.location.origin : '';

            if (isCapacitorNative()) {
                console.log('[AUTH] Starting NATIVE Google Sign-In...');

                try {
                    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');

                    // Trigger Native Dialog (Plan B)
                    const googleUser = await GoogleAuth.signIn();
                    console.log('✅ [AUTH] Native Google Success:', googleUser.email);

                    setStatusMessage("Connecting to dashboard...");

                    // Exchange ID Token for Supabase Session
                    const supabase = createSupabaseBrowserClient();
                    const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
                        provider: 'google',
                        token: googleUser.authentication.idToken,
                    });

                    if (authError) throw authError;
                    if (authData.session) {
                        await recordSessionLogin();

                        // Force cookie sync
                        const cookieValue = encodeURIComponent(JSON.stringify(authData.session));
                        document.cookie = `sb-auth-token=${cookieValue}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

                        router.push('/dashboard');
                        setTimeout(() => window.location.href = '/dashboard', 800);
                        return;
                    }
                } catch (nativeErr: any) {
                    console.error('❌ [AUTH] Native SDK failed, falling back to Browser:', nativeErr);
                    // Fallback to Plan A (Browser flow) if SDK fails
                }

                // --- PLAN A FALLBACK (Browser Flow) ---
                console.log('[AUTH] Falling back to Browser OAuth...');
                // ... rest of existing logic ...
                const supabase = createSupabaseBrowserClient();
                const redirectTo = origin.includes('localhost')
                    ? `${origin}/auth/callback`
                    : `${PROD_URL}/auth/callback`;

                await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo,
                        skipBrowserRedirect: false,
                    },
                });
            }
        } catch (err: any) {
            console.error('[Login] Google login error:', err);
            if (typeof window !== 'undefined') {
                (window as any).oauthLoginInProgress = false;
            }
            setError(err.message || 'Failed to initialize Google login');
            setLoading(false);
            setStatusMessage(null);
        }
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-sm text-muted-foreground">Checking session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            <Suspense fallback={null}>
                <TimeoutMessage setError={setError} />
            </Suspense>
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-subtle-glow" />
                </div>
                <div className="absolute inset-0 grid-pattern opacity-20" />
                <div className="relative z-10 flex flex-col justify-between p-12 text-white">
                    <div className="flex items-center gap-3">
                        <div className="icon-container bg-primary">
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold">Investment Intelligence</span>
                    </div>
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl font-bold leading-tight text-white">
                                Secure your
                                <br />
                                <span className="text-accent">
                                    investment legacy
                                </span>
                            </h1>
                            <p className="mt-4 text-lg text-white/70 max-w-md">
                                Track, protect, and ensure your loved ones can access your portfolio when it matters most.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <FeatureCard icon={Shield} title="Military-Grade Security" description="Your data is encrypted end-to-end" />
                            <FeatureCard icon={Users} title="Nominee Access" description="Trusted contacts get access during inactivity" />
                            <FeatureCard icon={Sparkles} title="Smart Insights" description="AI-powered portfolio analysis" />
                        </div>
                    </div>
                    <p className="text-sm text-white/40">Trusted by 10,000+ investors across India</p>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative overflow-hidden">
                <div className="grid-pattern-full dark:opacity-50" />
                <div className="w-full max-w-md relative z-10">
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="icon-container bg-primary">
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">Investment Intelligence</span>
                    </div>

                    <div className="card-base p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-foreground tracking-tight">Welcome back</h2>
                            <p className="text-muted-foreground mt-2">Sign in to access your portfolio</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
                                <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12 bg-background border-border focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-300 transition-colors"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                                    <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary transition-colors">Forgot password?</Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-12 bg-background border-border focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-300 transition-colors pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/25 transition-all duration-200"
                            >
                                {loading && !statusMessage ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Sign in
                                        <ArrowRight className="h-4 w-4" />
                                    </span>
                                )}
                            </Button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-background px-2 text-slate-500">Or continue with</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full h-12 bg-card border-border hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 relative"
                            >
                                {loading && statusMessage ? (
                                    <div className="flex flex-col items-center">
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            {statusMessage}
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        Continue with Google
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-slate-500">
                                Don&apos;t have an account?{" "}
                                <Link href="/signup" className="font-medium text-primary hover:text-primary transition-colors">Create account</Link>
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
                        <Shield className="h-4 w-4" />
                        <span>256-bit SSL encrypted</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
    return (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="icon-container bg-primary/20"><Icon className="h-5 w-5 text-accent" /></div>
            <div>
                <h3 className="font-medium text-white">{title}</h3>
                <p className="text-sm text-white/60">{description}</p>
            </div>
        </div>
    );
}
