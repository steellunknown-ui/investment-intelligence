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
    const cookiesToSet: { name: string; value: string; options: any }[] = [];

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(newCookies) {
                    newCookies.forEach(({ name, value, options }) => {
                        cookiesToSet.push({ name, value, options });
                        try {
                            cookieStore.set(name, value, options);
                        } catch {}
                    });
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
            skipBrowserRedirect: true,
        }
    });

    if (error) {
        console.error('[Auth Login] Error:', error.message);
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
    }
    
    if (data?.url) {
        const response = NextResponse.redirect(data.url);
        cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
        });
        return response;
    }
    
    return NextResponse.redirect(new URL('/login', request.url));
}
