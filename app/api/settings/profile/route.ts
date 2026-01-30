import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'

export async function GET() {
    try {
        const supabase = createSupabaseServerClient()
        
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        updateLastActivity(supabase, user.id)

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || '',
                phone: user.user_metadata?.phone || '',
                avatar_url: user.user_metadata?.avatar_url || null
            }
        })
    } catch (error) {
        console.error('Profile GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = createSupabaseServerClient()
        
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        updateLastActivity(supabase, user.id)

        const body = await request.json()
        const { full_name, phone } = body

        // Update user metadata
        const { error: updateError } = await supabase.auth.updateUser({
            data: { 
                full_name: full_name || user.user_metadata?.full_name,
                phone: phone || user.user_metadata?.phone
            }
        })

        if (updateError) {
            console.error('Update user error:', updateError)
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Profile PATCH error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}