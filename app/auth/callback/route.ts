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

        const cookieStore = cookies();
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
        // This completely bypasses the client-side PKCE crash. The server
        // exchanges the code safely, then hands the access and refresh tokens
        // to the app, which uses supabase.auth.setSession().
        // ──────────────────────────────────────────────────────────────────
        if (platform === 'capacitor') {
            const appCallbackUrl = new URL('com.investmentintelligence.auth://callback');
            appCallbackUrl.searchParams.set('access_token', data.session.access_token);
            appCallbackUrl.searchParams.set('refresh_token', data.session.refresh_token);
            appCallbackUrl.searchParams.set('next', next);

            // Non-critical background tasks
            try {
                const metadata = data.user.user_metadata || {};
                const full_name = metadata.full_name || metadata.name;
                const avatar_url = metadata.avatar_url || metadata.picture;
                const email = metadata.email || data.user.email;

                await supabase.from("profiles").upsert({
                    id: data.user.id,
                    full_name: full_name || null,
                    avatar_url: avatar_url || null,
                    email: email,
                    updated_at: new Date().toISOString(),
                }, { onConflict: "id" });
                await trackLoginActivity(supabase, data.user.id);
            } catch (e) {
                console.error('Background task failed (non-critical):', e);
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

        for (const cookie of cookiesToSet) {
            response.cookies.set(cookie.name, cookie.value, cookie.options);
        }

        try {
            const metadata = data.user.user_metadata || {};
            const full_name = metadata.full_name || metadata.name;
            const avatar_url = metadata.avatar_url || metadata.picture;
            const email = metadata.email || data.user.email;

            await supabase.from("profiles").upsert({
                id: data.user.id,
                full_name: full_name || null,
                avatar_url: avatar_url || null,
                email: email,
                updated_at: new Date().toISOString(),
            }, { onConflict: "id" });
            await trackLoginActivity(supabase, data.user.id);
        } catch (e) {
            console.error('Background task failed (non-critical):', e);
        }

        console.log('Auth successful, redirecting to:', redirectUrl);
        return response;

    } catch (error) {
        console.error('Auth callback fatal error:', error);
        return NextResponse.redirect(`${siteUrl}/login?error=fatal_error`);
    }
}

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
