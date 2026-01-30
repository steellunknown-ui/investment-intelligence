import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'

export async function GET() {
    try {
        const supabase = createSupabaseServerClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        updateLastActivity(supabase, user.id)

        const { data: config, error } = await supabase
            .from('inactivity_config')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows returned, which is okay for new users
            console.error('Inactivity config fetch error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch inactivity config' },
                { status: 500 }
            )
        }

        // Return default config if none exists
        const defaultConfig = {
            user_id: user.id,
            inactivity_days: 15,
            enabled: true,
            last_activity_at: null,
            warning_sent_at: null,
            triggered_at: null,
        }

        return NextResponse.json({ config: config ?? defaultConfig })
    } catch (error) {
        console.error('Inactivity GET error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = createSupabaseServerClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        updateLastActivity(supabase, user.id)

        const body = await request.json()
        const { inactivity_days, enabled } = body

        const { data: config, error } = await supabase
            .from('inactivity_config')
            .upsert({
                user_id: user.id,
                inactivity_days: inactivity_days ?? 15,
                enabled: enabled ?? true,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single()

        if (error) {
            console.error('Inactivity config upsert error:', error)
            return NextResponse.json(
                { error: 'Failed to update inactivity config' },
                { status: 500 }
            )
        }

        return NextResponse.json({ config })
    } catch (error) {
        console.error('Inactivity PUT error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
