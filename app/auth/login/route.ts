import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') as any;
    const platform = searchParams.get('platform');
    
    if (!provider) {
        return NextResponse.redirect(new URL('/login', request.url));
    }
    
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {}
                }
            }
        }
    );
    
    const redirectUrl = new URL('/auth/callback', request.url);
    if (platform) {
        redirectUrl.searchParams.set('platform', platform);
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: redirectUrl.toString(),
            skipBrowserRedirect: true, // We will manually redirect below so cookies are applied properly by Next.js
        }
    });

    if (error) {
        console.error('[Auth Login] Error:', error.message);
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
    }
    
    if (data?.url) {
        // Return a redirect response so that the setAll() cookies are attached to the response headers
        return NextResponse.redirect(data.url);
    }
    
    return NextResponse.redirect(new URL('/login', request.url));
}
