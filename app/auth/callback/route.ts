import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    // Use the correct site URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://investment-intellegince.vercel.app';

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
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { full_name, avatar_url, email } = user.user_metadata;

                await supabase
                    .from("profiles")
                    .upsert({
                        id: user.id,
                        full_name: full_name,
                        avatar_url: avatar_url,
                        email: email,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: "id" });
            }

            return NextResponse.redirect(`${siteUrl}${next}`);
        }
    }

    return NextResponse.redirect(`${siteUrl}/login?error=auth_failed`);
}
