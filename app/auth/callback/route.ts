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

        if (!code) {
            return NextResponse.redirect(`${siteUrl}/login?error=no_code`);
        }

        const cookieStore = cookies();
        const cookiesToSet: { name: string; value: string; options: any }[] = [];

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
                        } catch {}
                    },
                },
            }
        );

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('Auth exchange error:', error.message);
            return NextResponse.redirect(`${siteUrl}/login?error=auth_exchange_failed`);
        }

        if (!data?.user || !data?.session) {
            return NextResponse.redirect(`${siteUrl}/login?error=no_user_data`);
        }

        const redirectUrl = `${siteUrl}${next}`;
        const response = NextResponse.redirect(redirectUrl);

        for (const cookie of cookiesToSet) {
            response.cookies.set(cookie.name, cookie.value, cookie.options);
        }

        try {
            const metadata = data.user.user_metadata || {};
            await supabase.from("profiles").upsert({
                id: data.user.id,
                full_name: metadata.full_name || metadata.name || null,
                avatar_url: metadata.avatar_url || metadata.picture || null,
                email: metadata.email || data.user.email,
                updated_at: new Date().toISOString(),
            }, { onConflict: "id" });
            await trackLoginActivity(supabase, data.user.id);
        } catch (e) {
            console.error('Background task failed (non-critical):', e);
        }

        return response;

    } catch (error) {
        console.error('Auth callback fatal error:', error);
        return NextResponse.redirect(`${siteUrl}/login?error=fatal_error`);
    }
}
