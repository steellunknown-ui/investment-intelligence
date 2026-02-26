import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'

export async function GET(request: Request) {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const memberId = searchParams.get('memberId')

        if (!memberId) {
            return NextResponse.json({ error: 'Member ID required' }, { status: 400 })
        }

        // Verify access
        const { data: familyMember, error: accessError } = await supabase
            .from('family_members')
            .select('*, member_profile:profiles!family_members_member_user_id_fkey(full_name, email, avatar_url)')
            .eq('owner_id', user.id)
            .eq('member_user_id', memberId)
            .single()

        if (accessError || !familyMember) {
            return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
        }

        // Fetch all financial data
        const [accounts, assets, liabilities, holdings, receivables, belongings, insurance] = await Promise.all([
            supabase.from('bank_accounts').select('*').eq('user_id', memberId),
            supabase.from('assets').select('*').eq('user_id', memberId),
            supabase.from('liabilities').select('*').eq('user_id', memberId),
            supabase.from('holdings').select('*').eq('user_id', memberId),
            supabase.from('receivables').select('*').eq('user_id', memberId),
            supabase.from('belongings').select('*').eq('user_id', memberId),
            supabase.from('insurance_policies').select('*').eq('user_id', memberId)
        ])

        return NextResponse.json({
            member: familyMember,
            data: {
                accounts: accounts.data || [],
                assets: assets.data || [],
                liabilities: liabilities.data || [],
                holdings: holdings.data || [],
                receivables: receivables.data || [],
                belongings: belongings.data || [],
                insurance: insurance.data || []
            }
        })
    } catch (error) {
        console.error('Monitor API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
