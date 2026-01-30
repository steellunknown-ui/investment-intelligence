import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://investment-intellegince.vercel.app";

    try {
        // Step 1: Parse URL
        let code: string | null = null;
        let next = "/dashboard";

        try {
            const { searchParams } = new URL(request.url);
            code = searchParams.get("code");
            next = searchParams.get("next") ?? "/dashboard";
        } catch (urlError) {
            console.error('URL parsing error:', urlError);
            return NextResponse.redirect(`${siteUrl}/login?error=url_parse_failed`);
        }

        if (!code) {
            console.error('No auth code provided');
            return NextResponse.redirect(`${siteUrl}/login?error=no_code`);
        }

        // Step 2: Get cookies
        let cookieStore;
        try {
            cookieStore = cookies();
        } catch (cookieError) {
            console.error('Cookie access error:', cookieError);
            return NextResponse.redirect(`${siteUrl}/login?error=cookie_access_failed`);
        }

        // Step 3: Check environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error('Missing Supabase environment variables');
            return NextResponse.redirect(`${siteUrl}/login?error=missing_env_vars`);
        }

        // Step 4: Create Supabase client
        let supabase;
        try {
            supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                {
                    cookies: {
                        get(name: string) {
                            return cookieStore.get(name)?.value;
                        },
                        set(name: string, value: string, options: CookieOptions) {
                            cookieStore.set({ name, value, ...options });
                        },
                        remove(name: string, options: CookieOptions) {
                            cookieStore.delete({ name, ...options });
                        },
                    },
                }
            );
        } catch (clientError) {
            console.error('Supabase client creation error:', clientError);
            return NextResponse.redirect(`${siteUrl}/login?error=client_creation_failed`);
        }

        // Step 5: Exchange code for session
        let data, error;
        try {
            const result = await supabase.auth.exchangeCodeForSession(code);
            data = result.data;
            error = result.error;
        } catch (exchangeError) {
            console.error('Code exchange exception:', exchangeError);
            return NextResponse.redirect(`${siteUrl}/login?error=exchange_exception`);
        }

        if (error) {
            console.error('Auth exchange error:', error.message);
            return NextResponse.redirect(`${siteUrl}/login?error=auth_exchange_failed&msg=${encodeURIComponent(error.message)}`);
        }

        if (data?.user) {
            // Step 6: Upsert profile (non-critical)
            try {
                const { full_name, avatar_url, email } = data.user.user_metadata || {};
                await supabase
                    .from("profiles")
                    .upsert({
                        id: data.user.id,
                        full_name: full_name || null,
                        avatar_url: avatar_url || null,
                        email: email || data.user.email,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: "id" });
            } catch (profileErr) {
                console.error('Profile upsert failed (non-critical):', profileErr);
            }

            console.log('Auth successful, redirecting to:', `${siteUrl}${next}`);
            return NextResponse.redirect(`${siteUrl}${next}`);
        }

        console.error('No user data after auth');
        return NextResponse.redirect(`${siteUrl}/login?error=no_user_data`);

    } catch (error) {
        console.error('Auth callback fatal error:', error);
        return NextResponse.redirect(`${siteUrl}/login?error=fatal_error`);
    }
}

