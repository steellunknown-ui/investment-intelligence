import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'

export const dynamic = 'force-dynamic';

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

        const { data: alerts, error } = await supabase
            .from('alerts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Alerts fetch error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch alerts' },
                { status: 500 }
            )
        }

        // Count unread
        const unreadCount = (alerts ?? []).filter(a => !a.is_read).length

        return NextResponse.json({
            alerts: alerts ?? [],
            unreadCount
        })
    } catch (error) {
        console.error('Alerts GET error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
