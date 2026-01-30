import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get("next") ?? "/dashboard";

    // Use NEXT_PUBLIC_SITE_URL in production, origin in development
    const redirectOrigin = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_SITE_URL 
        : origin;

    if (code) {
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

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Get user session to extract metadata
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Upsert profile with Google data
                const { full_name, avatar_url, email } = user.user_metadata;

                await supabase
                    .from("profiles")
                    .upsert({
                        id: user.id,
                        full_name: full_name,
                        avatar_url: avatar_url,
                        email: email, // Optional, but good to have if schema allows
                        updated_at: new Date().toISOString(),
                    }, { onConflict: "id" });
            }

            return NextResponse.redirect(`${redirectOrigin}${next}`);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${redirectOrigin}/auth/auth-code-error`);
}
