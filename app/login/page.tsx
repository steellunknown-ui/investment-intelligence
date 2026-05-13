"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/supabase-browser";
import {
    recordSessionLogin,
    isSessionValid,
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
    const [checkingSession, setCheckingSession] = useState(true);

    // ── On mount: Check for existing valid session ──
    // If user has a valid session within 12 hours, skip login entirely
    useEffect(() => {
        const checkExistingSession = async () => {
            try {
                const supabase = createSupabaseBrowserClient();
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    // Check 12-hour timeout
                    const valid = await isSessionValid();
                    if (valid) {
                        // Session exists and is within 12 hours — go to dashboard
                        router.replace('/dashboard');
                        return;
                    }
                    // Session exists but 12-hour expired — sign out and show login
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

    // ── Capacitor Deep Link Listener ──
    // Handles the OAuth callback when returning from Chrome Custom Tab
    useEffect(() => {
        let isMounted = true;

        const setupDeepLinkListener = async () => {
            if (!isCapacitorNative()) return;

            try {
                const { App } = await import('@capacitor/app');

                App.addListener('appUrlOpen', async (data: any) => {
                    console.log('🚀 [DEEP LINK] Received URL:', data.url);

                    try {
                        const url = new URL(data.url);

                        // Close the in-app browser
                        try {
                            const { Browser } = await import('@capacitor/browser');
                            await Browser.close();
                            console.log('✅ [DEEP LINK] Browser closed');
                        } catch (e) {
                            console.log('⚠️ [DEEP LINK] Browser close error/ignored:', e);
                        }

                        // ── Primary Capacitor Auth: Handle code-based callback ──
                        const code = url.searchParams.get('code');

                        if (code && isMounted) {
                            setLoading(true);
                            // ── SET THE LOGIN LOCK ──
                            if (typeof window !== 'undefined') {
                                (window as any).isAuthenticating = true;
                            }

                            try {
                                console.log('🔄 [AUTH] Exchanging code via Capacitor client...');
                                
                                // Use the Capacitor client which has the PKCE verifier in native storage
                                const capacitorAuth = createCapacitorAuthClient();
                                const { data: exchangeData, error: exchangeError } = await capacitorAuth.auth.exchangeCodeForSession(code);

                                if (exchangeError) {
                                    console.error('❌ [AUTH] Code exchange error:', exchangeError);
                                    setError(exchangeError.message);
                                } else if (exchangeData.session) {
                                    console.log('✅ [AUTH] Code exchanged! Syncing session...');

                                    // Sync the session to the SSR client
                                    const ssrClient = createSupabaseBrowserClient();
                                    await ssrClient.auth.setSession({
                                        access_token: exchangeData.session.access_token,
                                        refresh_token: exchangeData.session.refresh_token,
                                    });

                                    await recordSessionLogin();
                                    router.push('/dashboard');
                                    router.refresh();
                                }
                            } catch (err) {
                                console.error('❌ [AUTH] Deep link session exception:', err);
                                setError('Failed to complete authentication');
                            } finally {
                                if (isMounted) setLoading(false);
                            }
                            return;
                        }

                        const errorParam = url.searchParams.get('error');
                        if (errorParam) {
                            console.error('❌ [DEEP LINK] Error param found:', errorParam);
                            setError(errorParam);
                            setLoading(false);
                            return;
                        }
                    } catch (urlErr) {
                        console.error('[Login] Failed to parse deep link URL:', urlErr);
                    }
                });
            } catch (err) {
                console.error('[Login] Failed to load Capacitor App plugin:', err);
            }
        };

        setupDeepLinkListener();

        return () => {
            isMounted = false;
        };
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

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

            // Record login time for 12-hour enforcement
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
            console.log('Starting Google Login...');
            setLoading(true);
            setError(null);

            const PROD_URL = 'https://investment-intellegince.vercel.app';
            const origin = typeof window !== 'undefined' ? window.location.origin : '';

            if (isCapacitorNative()) {
                // ── CAPACITOR GOOGLE LOGIN ──
                const capacitorAuth = createCapacitorAuthClient();
                const { Browser } = await import('@capacitor/browser');
                
                const { data, error } = await capacitorAuth.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: `${PROD_URL}/auth/callback?platform=capacitor`,
                        skipBrowserRedirect: true,
                    },
                });

                if (error) throw error;

                if (data?.url) {
                    await Browser.open({ url: data.url, windowName: '_self' });
                }
            } else {
                // ── WEB GOOGLE LOGIN ──
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
            setError(err.message || 'Failed to initialize Google login');
        } finally {
            setLoading(false);
        }
    };

    // Show a loading state while checking for existing session
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
                {/* Subtle emerald glow */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-subtle-glow" />
                </div>

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 grid-pattern opacity-20" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 text-white">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="icon-container bg-primary">
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold">Investment Intelligence</span>
                    </div>

                    {/* Main Content */}
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

                        {/* Feature Cards */}
                        <div className="space-y-4">
                            <FeatureCard
                                icon={Shield}
                                title="Military-Grade Security"
                                description="Your data is encrypted end-to-end"
                            />
                            <FeatureCard
                                icon={Users}
                                title="Nominee Access"
                                description="Trusted contacts get access during inactivity"
                            />
                            <FeatureCard
                                icon={Sparkles}
                                title="Smart Insights"
                                description="AI-powered portfolio analysis"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-sm text-white/40">
                        Trusted by 10,000+ investors across India
                    </p>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative overflow-hidden">
                {/* Shiny grid background */}
                <div className="grid-pattern-full dark:opacity-50" />
                <div className="w-full max-w-md relative z-10">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="icon-container bg-primary">
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">Investment Intelligence</span>
                    </div>

                    {/* Form Card */}
                    <div className="card-base p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-foreground tracking-tight">Welcome back</h2>
                            <p className="text-muted-foreground mt-2">Sign in to access your portfolio</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    Email address
                                </label>
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Password
                                    </label>
                                    <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary transition-colors">
                                        Forgot password?
                                    </Link>
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
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
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
                                {loading ? (
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
                                className="w-full h-12 bg-card border-border hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Continue with Google (Secure)
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-slate-500">
                                Don&apos;t have an account?{" "}
                                <Link
                                    href="/signup"
                                    className="font-medium text-primary hover:text-primary transition-colors"
                                >
                                    Create account
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Security Badge */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
                        <Shield className="h-4 w-4" />
                        <span>256-bit SSL encrypted</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="icon-container bg-primary/20">
                <Icon className="h-5 w-5 text-accent" />
            </div>
            <div>
                <h3 className="font-medium text-white">{title}</h3>
                <p className="text-sm text-white/60">{description}</p>
            </div>
        </div>
    );
}
