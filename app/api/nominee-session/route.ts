import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')

        if (!token) {
            return NextResponse.json({ error: 'Session token is required' }, { status: 400 })
        }

        const supabase = createSupabaseServerClient()

        // 1. Fetch the active session
        const { data: rawSession, error: sessionError } = await supabase
            .from('nominee_sessions')
            .select(`
                *,
                nominee: nominees (
                    name,
                    email,
                    relationship,
                    access_level
                )
            `)
            .eq('session_token', token)
            .eq('is_active', true)
            .single()

        const session = rawSession as any;

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Valid session not found. Please log in again.' }, { status: 401 })
        }

        // 2. Check Expiration
        const expiresAt = new Date(session.expires_at)
        if (new Date() > expiresAt) {
            // Deactivate session
            await supabase.from('nominee_sessions').update({ is_active: false }).eq('id', session.id)
            return NextResponse.json({ error: 'Session expired. Please verify your identity again.' }, { status: 401 })
        }

        // 3. Return session context
        return NextResponse.json({
            valid: true,
            session: {
                user_id: session.user_id, // The portfolio owner's UUID
                permissions: session.permissions,
                nominee_name: session.nominee?.[0]?.name || session.nominee?.name,
                nominee_access_level: session.nominee?.[0]?.access_level || session.nominee?.access_level
            }
        })

    } catch (error) {
        console.error('Session validation error:', error)
        return NextResponse.json({ error: 'Internal server error processing session validation' }, { status: 500 })
    }
}
