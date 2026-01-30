import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'

export async function PATCH() {
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

        // Mark onboarding as completed
        const { error } = await supabase
            .from('profiles')
            .update({
                onboarding_completed: true,
                onboarding_dismissed_at: new Date().toISOString()
            })
            .eq('id', user.id)

        if (error) {
            console.error('Onboarding complete error:', error)
            return NextResponse.json(
                { error: 'Failed to complete onboarding' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Onboarding complete error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
