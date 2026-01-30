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

        const { data: holdings, error } = await supabase
            .from('holdings')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Holdings fetch error:', error)
            return NextResponse.json(
                { error: 'Failed to fetch holdings' },
                { status: 500 }
            )
        }

        return NextResponse.json({ holdings: holdings ?? [] })
    } catch (error) {
        console.error('Holdings GET error:', error)
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
        const { symbol, name, asset_type, quantity, avg_buy_price, notes } = body

        // Validate required fields
        if (!symbol || quantity === undefined || quantity === null) {
            return NextResponse.json(
                { error: 'Symbol and quantity are required' },
                { status: 400 }
            )
        }

        const { data: holding, error } = await supabase
            .from('holdings')
            .insert({
                user_id: user.id,
                symbol: symbol.toUpperCase(),
                name: name || null,
                asset_type: asset_type || 'stock',
                quantity: Number(quantity),
                avg_buy_price: avg_buy_price ? Number(avg_buy_price) : null,
                notes: notes || null,
            })
            .select()
            .single()

        if (error) {
            console.error('Holdings insert error:', error)
            return NextResponse.json(
                { error: 'Failed to create holding' },
                { status: 500 }
            )
        }

        return NextResponse.json({ holding }, { status: 201 })
    } catch (error) {
        console.error('Holdings POST error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
