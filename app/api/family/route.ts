import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'

export async function GET() {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: members, error } = await supabase
            .from('family_members')
            .select('*, member_profile:profiles!family_members_member_user_id_fkey(full_name, email, avatar_url)')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Family members fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch family members' }, { status: 500 })
        }

        return NextResponse.json({ members: members || [] })
    } catch (error) {
        console.error('Family members GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { email, relation } = await request.json()

        if (!email || !relation) {
            return NextResponse.json({ error: 'Email and relation are required' }, { status: 400 })
        }

        // Use admin client to check auth.users
        const { supabaseAdmin } = await import('@/src/lib/supabase/admin')
        const { data: authData } = await supabaseAdmin.auth.admin.listUsers()
        const memberUser = authData?.users?.find(u => u.email === email)
        
        if (!memberUser) {
            return NextResponse.json({ error: 'User must create account first' }, { status: 404 })
        }

        // Check if already added
        const { data: existing } = await supabase
            .from('family_members')
            .select('id')
            .eq('owner_id', user.id)
            .eq('member_user_id', memberUser.id)
            .single()

        if (existing) {
            return NextResponse.json({ error: 'Member already added' }, { status: 400 })
        }

        // Insert family member
        const { data: member, error } = await supabase
            .from('family_members')
            .insert({
                owner_id: user.id,
                member_user_id: memberUser.id,
                relation,
                role: 'viewer'
            })
            .select()
            .single()

        if (error) {
            console.error('Family member insert error:', error)
            return NextResponse.json({ error: 'Failed to add family member' }, { status: 500 })
        }

        return NextResponse.json({ member }, { status: 201 })
    } catch (error) {
        console.error('Family members POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
