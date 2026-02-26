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

        // Get owner profile for email
        const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', user.id)
            .single()

        // Check if user exists
        const { data: memberProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('email', email)
            .single()

        if (memberProfile) {
            // User exists - add to family members
            const { data: existing } = await supabase
                .from('family_members')
                .select('id')
                .eq('owner_id', user.id)
                .eq('member_user_id', memberProfile.user_id)
                .single()

            if (existing) {
                return NextResponse.json({ error: 'Member already added' }, { status: 400 })
            }

            const { data: member, error } = await supabase
                .from('family_members')
                .insert({
                    owner_id: user.id,
                    member_user_id: memberProfile.user_id,
                    relation,
                    role: 'viewer'
                })
                .select()
                .single()

            if (error) {
                console.error('Family member insert error:', error)
                return NextResponse.json({ error: 'Failed to add family member' }, { status: 500 })
            }

            // Send monitoring notification
            try {
                const { sendEmail } = await import('@/src/lib/resend')
                await sendEmail({
                    to: email,
                    subject: `${ownerProfile?.full_name || 'Someone'} is now monitoring your portfolio`,
                    html: `
                        <h2>Portfolio Monitoring Notification</h2>
                        <p>Hi,</p>
                        <p><strong>${ownerProfile?.full_name || 'A family member'}</strong> (${ownerProfile?.email}) has added you to their Family Hub.</p>
                        <p>They can now view your financial portfolio in <strong>read-only mode</strong>.</p>
                        <p><strong>What this means:</strong></p>
                        <ul>
                            <li>They can see your accounts, assets, and investments</li>
                            <li>They cannot edit or delete anything</li>
                            <li>Your data remains secure</li>
                        </ul>
                        <p>Relation: <strong>${relation}</strong></p>
                        <p>If you have concerns, please contact them directly.</p>
                        <br>
                        <p>Best regards,<br>Investment Intelligence Team</p>
                    `
                })
            } catch (emailError) {
                console.error('Email notification failed:', emailError)
            }

            return NextResponse.json({ member, status: 'added' }, { status: 201 })
        } else {
            // User doesn't exist - send invite email
            try {
                const { sendEmail } = await import('@/src/lib/resend')
                const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL}/signup?ref=${user.id}`
                
                await sendEmail({
                    to: email,
                    subject: `${ownerProfile?.full_name || 'Someone'} invited you to Investment Intelligence`,
                    html: `
                        <h2>You're Invited to Investment Intelligence</h2>
                        <p>Hi,</p>
                        <p><strong>${ownerProfile?.full_name || 'Someone'}</strong> (${ownerProfile?.email}) wants to monitor your financial portfolio.</p>
                        <p>They've added you as their <strong>${relation}</strong> in the Family Hub.</p>
                        <br>
                        <p><strong>What happens next?</strong></p>
                        <ol>
                            <li>Create your free account</li>
                            <li>Add your financial data (bank accounts, assets, etc.)</li>
                            <li>${ownerProfile?.full_name} can view your portfolio in read-only mode</li>
                        </ol>
                        <br>
                        <a href="${inviteLink}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Create Account</a>
                        <br><br>
                        <p style="color: #64748b; font-size: 14px;">Or copy this link: ${inviteLink}</p>
                        <br>
                        <p>Best regards,<br>Investment Intelligence Team</p>
                    `
                })

                return NextResponse.json({ 
                    status: 'invited',
                    message: 'Invitation email sent. They will be added once they create an account.' 
                }, { status: 200 })
            } catch (emailError) {
                console.error('Invite email failed:', emailError)
                return NextResponse.json({ error: 'Failed to send invitation email' }, { status: 500 })
            }
        }
    } catch (error) {
        console.error('Family members POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
