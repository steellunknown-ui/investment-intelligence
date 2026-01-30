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

        const { data: nominees, error } = await supabase
            .from('nominees')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Nominees fetch error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch nominees' },
                { status: 500 }
            )
        }

        return NextResponse.json({ nominees: nominees ?? [] })
    } catch (error) {
        console.error('Nominees GET error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

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
        const { name, email, relationship, access_level } = body

        // Validate required fields
        if (!name || !email) {
            return NextResponse.json(
                { error: 'Name and email are required' },
                { status: 400 }
            )
        }

        // Check nominee limit (max 3)
        const { count } = await supabase
            .from('nominees')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        if (count !== null && count >= 3) {
            return NextResponse.json(
                { error: 'Maximum of 3 nominees allowed' },
                { status: 400 }
            )
        }

        const { data: nominee, error } = await supabase
            .from('nominees')
            .insert({
                user_id: user.id,
                name,
                email: email.toLowerCase(),
                relationship: relationship || null,
                access_level: access_level || 'view_only',
                is_verified: false,
            })
            .select()
            .single()

        if (error) {
            console.error('Nominees insert error:', error)
            return NextResponse.json(
                { error: 'Failed to create nominee' },
                { status: 500 }
            )
        }

        return NextResponse.json({ nominee }, { status: 201 })
    } catch (error) {
        console.error('Nominees POST error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
