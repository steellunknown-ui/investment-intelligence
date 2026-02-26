import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'

export async function GET() {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch all financial data
        const [assets, holdings, belongings, liabilities] = await Promise.all([
            supabase.from('assets').select('*').eq('user_id', user.id),
            supabase.from('holdings').select('*').eq('user_id', user.id),
            supabase.from('belongings').select('*').eq('user_id', user.id),
            supabase.from('liabilities').select('*').eq('user_id', user.id)
        ])

        // Calculate diversification
        const diversification = [
            { name: 'Equity', value: (holdings.data || []).reduce((sum, h) => sum + (h.current_value || 0), 0) },
            { name: 'Property', value: (assets.data || []).filter(a => a.asset_type === 'property').reduce((sum, a) => sum + (a.current_value || 0), 0) },
            { name: 'Gold', value: (belongings.data || []).filter(b => b.category === 'jewelry').reduce((sum, b) => sum + (b.current_value || 0), 0) },
            { name: 'Cash', value: (assets.data || []).filter(a => a.asset_type === 'fd' || a.asset_type === 'savings').reduce((sum, a) => sum + (a.current_value || 0), 0) },
            { name: 'Others', value: (belongings.data || []).filter(b => b.category !== 'jewelry').reduce((sum, b) => sum + (b.current_value || 0), 0) }
        ].filter(d => d.value > 0)

        // Calculate risk score
        const riskWeights = { Equity: 8, Property: 4, Gold: 3, Cash: 2, Others: 5 }
        const totalValue = diversification.reduce((sum, d) => sum + d.value, 0)
        const riskScore = totalValue > 0 
            ? diversification.reduce((sum, d) => sum + (d.value / totalValue) * (riskWeights[d.name as keyof typeof riskWeights] || 5), 0)
            : 0

        // Sector allocation from holdings
        const sectorAllocation = (holdings.data || []).reduce((acc: any[], h) => {
            const sector = h.sector || 'Others'
            const existing = acc.find(s => s.name === sector)
            if (existing) {
                existing.value += h.current_value || 0
            } else {
                acc.push({ name: sector, value: h.current_value || 0 })
            }
            return acc
        }, [])

        // Mock returns data (6 months)
        const returnsData = Array.from({ length: 6 }, (_, i) => ({
            month: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
            portfolio: 100 + Math.random() * 20 - 5,
            nifty: 100 + Math.random() * 15,
            fd: 100 + i * 0.5
        }))

        // Calculate total return
        const totalReturn = returnsData.length > 0 
            ? ((returnsData[returnsData.length - 1].portfolio - returnsData[0].portfolio) / returnsData[0].portfolio) * 100
            : 0

        return NextResponse.json({
            diversification,
            riskScore: Math.round(riskScore * 10) / 10,
            totalReturn: Math.round(totalReturn * 10) / 10,
            returnsData,
            sectorAllocation: sectorAllocation.sort((a, b) => b.value - a.value).slice(0, 5)
        })
    } catch (error) {
        console.error('Analytics summary error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
