import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        const next = searchParams.get("next") ?? "/dashboard";
        
        // Use the correct site URL
        const siteUrl = "https://investment-intelligence.vercel.app";

        if (!code) {
            console.error('No auth code provided');
            return NextResponse.redirect(`${siteUrl}/login?error=no_code`);
        }

        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('Auth exchange error:', error);
            return NextResponse.redirect(`${siteUrl}/login?error=auth_exchange_failed`);
        }

        if (data?.user) {
            try {
                // Upsert profile with Google data
                const { full_name, avatar_url, email } = data.user.user_metadata;

                const { error: profileError } = await supabase
                    .from("profiles")
                    .upsert({
                        id: data.user.id,
                        full_name: full_name || null,
                        avatar_url: avatar_url || null,
                        email: email || data.user.email,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: "id" });

                if (profileError) {
                    console.error('Profile upsert error:', profileError);
                    // Continue anyway - profile creation is not critical
                }
            } catch (profileErr) {
                console.error('Profile creation failed:', profileErr);
                // Continue anyway
            }

            console.log('Auth successful, redirecting to:', `${siteUrl}${next}`);
            return NextResponse.redirect(`${siteUrl}${next}`);
        }

        console.error('No user data after successful auth');
        return NextResponse.redirect(`${siteUrl}/login?error=no_user_data`);
        
    } catch (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(`https://investment-intelligence.vercel.app/login?error=callback_failed`);
    }
}
