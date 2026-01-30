import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { updateLastActivity } from '@/src/lib/activity'

export async function DELETE(
    request: Request,
    { params }: { params: { id: string, paymentId: string } }
) {
    try {
        const supabase = createSupabaseServerClient()
        const { id, paymentId } = params // liability_id, payment_id

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        updateLastActivity(supabase, user.id)

        // Verify ownership (join not needed if RLS is good, but good practice to check logic)
        // Check if payment belongs to liability which belongs to user
        const { data: payment, error: paymentError } = await supabase
            .from('liability_payments')
            .select('id')
            .eq('id', paymentId)
            .eq('liability_id', id)
            .eq('user_id', user.id)
            .single()

        if (paymentError || !payment) {
            return NextResponse.json(
                { error: 'Payment not found or access denied' },
                { status: 404 }
            )
        }

        const { error } = await supabase
            .from('liability_payments')
            .delete()
            .eq('id', paymentId)

        if (error) {
            console.error('Payment delete error:', error)
            return NextResponse.json(
                { error: 'Failed to delete payment' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Liability payment DELETE error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
