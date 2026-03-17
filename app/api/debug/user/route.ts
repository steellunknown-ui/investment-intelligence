import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'

export async function GET() {
    try {
        const supabase = createSupabaseServerClient()
        
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Return user metadata for debugging
        return NextResponse.json({
            user_id: user.id,
            email: user.email,
            user_metadata: user.user_metadata,
            app_metadata: user.app_metadata,
            providers: user.app_metadata?.providers || [],
            picture_url: user.user_metadata?.picture || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null
        })
    } catch (error) {
        console.error('Debug user error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}