import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'

export async function DELETE(
    request: Request,
    { params }: { params: { paymentId: string } }
) {
    try {
        const supabase = createSupabaseServerClient()
        const { paymentId } = params

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        updateLastActivity(supabase, user.id)

        const { error } = await supabase
            .from('insurance_payments')
            .delete()
            .eq('id', paymentId)
            .eq('user_id', user.id)

        if (error) {
            console.error('Insurance payment delete error:', error)
            return NextResponse.json(
                { error: 'Failed to delete payment' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Insurance payment DELETE error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
