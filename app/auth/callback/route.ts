import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { trackLoginActivity } from "@/src/lib/login-tracker";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://investment-intellegince.vercel.app";

    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        const next = searchParams.get("next") ?? "/dashboard";
        const platform = searchParams.get("platform");

        if (!code) {
            console.error('No auth code provided');
            return NextResponse.redirect(`${siteUrl}/login?error=no_code`);
        }

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error('Missing Supabase environment variables');
            return NextResponse.redirect(`${siteUrl}/login?error=missing_env_vars`);
        }

        // ──────────────────────────────────────────────────────────────────
        // KEY FIX: Collect cookies that Supabase sets during code exchange,
        // then write them DIRECTLY onto the redirect NextResponse.
        //
        // Previously, we used cookies().set() which writes to a different
        // response context that does NOT reliably merge with the returned
        // NextResponse.redirect(). This caused the session tokens to be
        // silently lost, so the user arrives at /dashboard with no session
        // and gets bounced right back to /login.
        // ──────────────────────────────────────────────────────────────────

        const cookieStore = cookies();

        // Accumulate all cookies Supabase wants to set during exchangeCodeForSession
        const cookiesToSet: { name: string; value: string; options: any }[] = [];

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookies) {
                        cookies.forEach(({ name, value, options }) => {
                            cookiesToSet.push({ name, value, options });
                        });

                        // Also try to set via cookieStore as fallback
                        try {
                            cookies.forEach(({ name, value, options }) => {
                                cookieStore.set(name, value, options);
                            });
                        } catch {
                            // Will be set on response below
                        }
                    },
                },
            }
        );

        // Exchange code for session — this triggers setAll() above
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('Auth exchange error:', error.message);
            return NextResponse.redirect(`${siteUrl}/login?error=auth_exchange_failed&msg=${encodeURIComponent(error.message)}`);
        }

        if (!data?.user) {
            console.error('No user data after auth');
            return NextResponse.redirect(`${siteUrl}/login?error=no_user_data`);
        }

        // Create the redirect response
        const redirectUrl = `${siteUrl}${next}`;

        // If coming from Android app, we redirect to the custom scheme
        if (platform === 'android') {
            const appRedirectUrl = `com.investmentintelligence.auth://callback?code=${code}&next=${encodeURIComponent(next)}`;
            console.log('Android app detected, redirecting to scheme:', appRedirectUrl);
            return NextResponse.redirect(appRedirectUrl);
        }

        const response = NextResponse.redirect(redirectUrl);

        // CRITICAL: Write ALL accumulated session cookies onto this response
        for (const cookie of cookiesToSet) {
            response.cookies.set(cookie.name, cookie.value, cookie.options);
        }

        // Non-critical: Upsert profile
        try {
            const metadata = data.user.user_metadata || {};
            const full_name = metadata.full_name || metadata.name;
            const avatar_url = metadata.avatar_url || metadata.picture;
            const email = metadata.email || data.user.email;

            await supabase
                .from("profiles")
                .upsert({
                    id: data.user.id,
                    full_name: full_name || null,
                    avatar_url: avatar_url || null,
                    email: email,
                    updated_at: new Date().toISOString(),
                }, { onConflict: "id" });
        } catch (profileErr) {
            console.error('Profile upsert failed (non-critical):', profileErr);
        }

        // Non-critical: Track login
        try {
            await trackLoginActivity(supabase, data.user.id);
        } catch (trackErr) {
            console.error('Login tracking failed (non-critical):', trackErr);
        }

        console.log('Auth successful, redirecting to:', redirectUrl, 'cookies set:', cookiesToSet.length);
        return response;

    } catch (error) {
        console.error('Auth callback fatal error:', error);
        return NextResponse.redirect(`${siteUrl}/login?error=fatal_error`);
    }
}
