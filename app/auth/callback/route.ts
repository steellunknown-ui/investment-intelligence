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

            // For Capacitor: redirect back to app with error
            if (platform === 'capacitor') {
                const errorUrl = `com.investmentintelligence.auth://callback?error=${encodeURIComponent(error.message)}`;
                return createCapacitorRedirectPage(errorUrl, 'Authentication failed', error.message);
            }

            return NextResponse.redirect(`${siteUrl}/login?error=auth_exchange_failed&msg=${encodeURIComponent(error.message)}`);
        }

        if (!data?.user || !data?.session) {
            console.error('No user/session data after auth');

            if (platform === 'capacitor') {
                const errorUrl = `com.investmentintelligence.auth://callback?error=no_session`;
                return createCapacitorRedirectPage(errorUrl, 'Authentication failed', 'No session data');
            }

            return NextResponse.redirect(`${siteUrl}/login?error=no_user_data`);
        }

        // ──────────────────────────────────────────────────────────────────
        // CAPACITOR PATH: Send tokens back to the app via deep link.
        //
        // This is the PERMANENT fix for the PKCE error. Instead of the
        // client exchanging the code (which needs the PKCE verifier from
        // localStorage that may have been cleared), the SERVER exchanges
        // the code here and sends the resulting access_token + refresh_token
        // back to the Capacitor app via its custom URL scheme.
        //
        // The app's deep link handler (in login/page.tsx) picks up these
        // tokens and calls supabase.auth.setSession() to establish the
        // session on the client, then stores them in native storage.
        // ──────────────────────────────────────────────────────────────────
        if (platform === 'capacitor') {
            // Build the deep link URL with session tokens
            const appCallbackUrl = new URL('com.investmentintelligence.auth://callback');
            appCallbackUrl.searchParams.set('access_token', data.session.access_token);
            appCallbackUrl.searchParams.set('refresh_token', data.session.refresh_token);
            appCallbackUrl.searchParams.set('next', next);

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

            console.log('Auth successful (Capacitor), redirecting via deep link');
            return createCapacitorRedirectPage(
                appCallbackUrl.toString(),
                'Signing you in...',
                'Redirecting you back to the app.'
            );
        }

        // ──────────────────────────────────────────────────────────────────
        // WEB PATH: Normal cookie-based redirect
        // ──────────────────────────────────────────────────────────────────
        const redirectUrl = `${siteUrl}${next}`;
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

/**
 * Creates an HTML page that redirects to the Capacitor app via its custom URL scheme.
 * This is needed because you can't do a 302 redirect to a custom scheme.
 * The page auto-redirects after a short delay and also provides a manual click button.
 */
function createCapacitorRedirectPage(url: string, title: string, subtitle: string) {
    return new NextResponse(
        `<!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>${title}</title>
                <style>
                    body {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        background: #f8fafc;
                        color: #334155;
                    }
                    .container { text-align: center; padding: 20px; }
                    h2 { color: #10b981; margin-bottom: 8px; }
                    p { color: #64748b; margin-bottom: 16px; }
                    .btn {
                        display: inline-block;
                        padding: 12px 24px;
                        background: #10b981;
                        color: white;
                        border-radius: 8px;
                        text-decoration: none;
                        margin-top: 10px;
                        font-weight: 500;
                    }
                    .spinner {
                        width: 32px;
                        height: 32px;
                        border: 3px solid #e2e8f0;
                        border-top: 3px solid #10b981;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 16px;
                    }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="spinner"></div>
                    <h2>${title}</h2>
                    <p>${subtitle}</p>
                    <a href="${url}" class="btn">Click here if not redirected</a>
                </div>
                <script>
                    // Redirect after a short delay to ensure the page renders
                    setTimeout(function() {
                        window.location.href = "${url}";
                    }, 300);
                </script>
            </body>
        </html>`,
        {
            headers: { 'Content-Type': 'text/html' },
        }
    );
}
