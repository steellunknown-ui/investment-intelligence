import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server';
import { callOpenRouter } from '@/lib/ai';

export const maxDuration = 60; // Allow AI responses to take up to 60s
export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/chat
 * Main chat endpoint - requires authentication
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = createSupabaseServerClient();

        // Check authentication
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;
        const body = await req.json();
        const { message } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Fetch user context from Supabase
        const context = await fetchUserContext(supabase, userId);

        // Call AI with context
        const aiResponse = await callOpenRouter(message, context);

        return NextResponse.json(aiResponse);
    } catch (error) {
        console.error('AI chat error:', error);
        return NextResponse.json(
            {
                error: 'Failed to process AI request',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * Fetch comprehensive user context from Supabase
 */
async function fetchUserContext(supabase: any, userId: string) {
    try {
        // Fetch profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', userId)
            .single();

        // Fetch bank accounts
        const { data: bankAccounts } = await supabase
            .from('bank_accounts')
            .select('current_balance, status')
            .eq('user_id', userId);

        const totalBankBalance = bankAccounts
            ?.filter((acc: any) => acc.status === 'active')
            .reduce((sum: number, acc: any) => sum + (acc.current_balance || 0), 0) || 0;

        // Fetch assets
        const { data: assets } = await supabase
            .from('assets')
            .select('current_market_value, asset_type, asset_category')
            .eq('user_id', userId);

        const totalAssets = assets?.reduce(
            (sum: number, asset: any) => sum + (asset.current_market_value || 0),
            0
        ) || 0;

        // Fetch belongings
        const { data: belongings } = await supabase
            .from('belongings')
            .select('current_estimated_value, category')
            .eq('user_id', userId);

        const totalBelongings = belongings?.reduce(
            (sum: number, item: any) => sum + (item.current_estimated_value || 0),
            0
        ) || 0;

        // Fetch receivables
        const { data: receivables } = await supabase
            .from('receivables')
            .select('outstanding_amount, status')
            .eq('user_id', userId);

        const totalReceivables = receivables
            ?.filter((r: any) => r.status === 'pending' || r.status === 'partial')
            .reduce((sum: number, r: any) => sum + (r.outstanding_amount || 0), 0) || 0;

        // Fetch liabilities
        const { data: liabilities } = await supabase
            .from('liabilities')
            .select('outstanding_amount, loan_type, status')
            .eq('user_id', userId);

        const totalLiabilities = liabilities
            ?.filter((l: any) => l.status === 'active')
            .reduce((sum: number, l: any) => sum + (l.outstanding_amount || 0), 0) || 0;

        // Fetch insurance policies
        const { data: insurance } = await supabase
            .from('insurance_policies')
            .select('next_premium_due, status, premium_amount')
            .eq('user_id', userId);

        const activeInsurance = insurance?.filter((p: any) => p.status === 'active') || [];
        const overdueInsurance = activeInsurance.filter((p: any) => {
            if (!p.next_premium_due) return false;
            return new Date(p.next_premium_due) < new Date();
        }).length;

        // Fetch unread alerts
        const { data: alerts } = await supabase
            .from('alerts')
            .select('id')
            .eq('user_id', userId)
            .eq('is_read', false);

        const totalAssetValue = totalBankBalance + totalAssets + totalBelongings + totalReceivables;
        const netWorth = totalAssetValue - totalLiabilities;

        return {
            profile: {
                full_name: profile?.full_name || 'User',
                email: profile?.email || '',
            },
            netWorth: {
                assets: totalAssetValue,
                liabilities: totalLiabilities,
                total: netWorth,
            },
            accounts: {
                total: bankAccounts?.length || 0,
                balance: totalBankBalance,
            },
            insurance: {
                total: activeInsurance.length,
                overdue: overdueInsurance,
            },
            receivables: totalReceivables,
            alerts: alerts?.length || 0,
            breakdown: {
                bankAccounts: totalBankBalance,
                assets: totalAssets,
                belongings: totalBelongings,
                receivables: totalReceivables,
                liabilities: totalLiabilities,
                insurancePolicies: activeInsurance.length,
            },
        };
    } catch (error) {
        console.error('Error fetching user context:', error);
        throw new Error('Failed to fetch user context');
    }
}
