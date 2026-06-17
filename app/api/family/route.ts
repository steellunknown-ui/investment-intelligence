import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { encrypt, decrypt, encryptFields, decryptFields } from '@/src/lib/encryption'

export async function GET() {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: members, error } = await supabase
            .from('family_members')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Family members fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch family members' }, { status: 500 })
        }

        // Manually fetch profiles for each member
        const membersWithProfiles = await Promise.all(
            (members || []).map(async (member) => {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, email, avatar_url')
                    .eq('user_id', member.member_user_id)
                    .single()
                
                const decryptedMember = decryptFields(member, ['member_name', 'relation'])
                return {
                    ...decryptedMember,
                    member_profile: profile
                }
            })
        )

        return NextResponse.json({ members: membersWithProfiles })
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

        const { email, relation, name } = await request.json()

        if (!email || !relation || !name) {
            return NextResponse.json({ error: 'Name, email and relation are required' }, { status: 400 })
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
        const newMemberData = encryptFields({
            owner_id: user.id,
            member_user_id: memberUser.id,
            member_name: name,
            relation: relation,
            role: 'viewer'
        }, ['member_name', 'relation']);

        const { data: member, error } = await supabase
            .from('family_members')
            .insert(newMemberData)
            .select()
            .single()

        if (error) {
            console.error('Family member insert error:', error)
            return NextResponse.json({ error: error.message || 'Failed to add family member' }, { status: 500 })
        }

        // Update member profile with name
        await supabase
            .from('profiles')
            .update({ full_name: name })
            .eq('user_id', memberUser.id)

        // Fetch updated profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url')
            .eq('user_id', memberUser.id)
            .single()

        const decryptedMember = decryptFields(member, ['member_name', 'relation'])

        return NextResponse.json({ 
            member: {
                ...decryptedMember,
                member_profile: profile
            }
        }, { status: 201 })
    } catch (error) {
        console.error('Family members POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
