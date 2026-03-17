import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/last-login
 * 
 * Returns the current user's last login timestamp
 * from the inactivity_tracker table.
 */
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

        const { data: tracker, error } = await supabase
            .from('inactivity_tracker')
            .select('last_login_at')
            .eq('user_id', user.id)
            .single()

        if (error && error.code !== 'PGRST116') {
            console.error('Last login fetch error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch last login' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            lastLoginAt: tracker?.last_login_at || null
        })
    } catch (error) {
        console.error('Last login GET error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
