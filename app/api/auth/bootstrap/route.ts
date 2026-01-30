import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/src/lib/supabase/admin'

export async function POST(request: Request) {
    try {
        const { fullName } = await request.json().catch(() => ({}))

        // Get the current user from the session
        const cookieStore = cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value, ...options })
                        } catch {
                            // Ignore
                        }
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: '', ...options })
                        } catch {
                            // Ignore
                        }
                    },
                },
            }
        )

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Upsert profile using admin client
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: user.id,
                email: user.email,
                full_name: fullName || null,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'id'
            })

        if (profileError) {
            console.error('Profile upsert error:', profileError)
            return NextResponse.json(
                { error: 'Failed to create profile' },
                { status: 500 }
            )
        }

        // Upsert inactivity_config with defaults
        const { error: configError } = await supabaseAdmin
            .from('inactivity_config')
            .upsert({
                user_id: user.id,
                inactivity_days: 15,
                enabled: true,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id'
            })

        if (configError) {
            console.error('Inactivity config upsert error:', configError)
            // Non-fatal - profile was created successfully
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Bootstrap error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
