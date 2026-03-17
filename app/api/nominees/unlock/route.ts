import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'

export async function POST(request: Request) {
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
        const { nominee_id, action } = body

        if (!nominee_id || !['unlock', 'lock'].includes(action)) {
            return NextResponse.json(
                { error: 'Valid Nominee ID and action (unlock/lock) required' },
                { status: 400 }
            )
        }

        // Verify the user owns the nominee
        const { data: nominee, error: checkError } = await supabase
            .from('nominees')
            .select('id')
            .eq('id', nominee_id)
            .eq('user_id', user.id)
            .single()

        if (checkError || !nominee) {
            return NextResponse.json({ error: 'Nominee not found or unauthorized' }, { status: 404 })
        }

        // Perform the action
        const updates =
            action === 'unlock'
                ? { is_blocked: false, failed_attempts: 0, blocked_until: null }
                : { is_blocked: true, blocked_until: new Date(Date.now() + 86400000 * 365).toISOString() } // lock for a year

        const { error: updateError } = await supabase
            .from('nominees')
            .update(updates)
            .eq('id', nominee_id)

        if (updateError) throw updateError

        return NextResponse.json({
            success: true,
            message: `Nominee successfully ${action}ed`
        })

    } catch (error) {
        console.error('Nominee admin action error:', error)
        return NextResponse.json(
            { error: 'Internal server error processing admin action' },
            { status: 500 }
        )
    }
}
