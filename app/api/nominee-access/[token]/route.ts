import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase/admin';
import { decryptNumericFields, decryptNumber } from '@/src/lib/encryption';

// GET /api/nominee-access/[token]
// Public endpoint - validates token and returns read-only portfolio data
export async function GET(
    request: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        if (!token || token.length < 64) {
            return NextResponse.json(
                { error: 'Invalid token format' },
                { status: 400 }
            );
        }

        const now = new Date().toISOString();

        // Validate token exists and not expired
        const { data: tokenData, error: tokenError } = await supabaseAdmin
            .from('nominee_access_tokens')
            .select('id, user_id, nominee_id, expires_at, used_at')
            .eq('token', token)
            .gt('expires_at', now)
            .single();

        if (tokenError || !tokenData) {
            return NextResponse.json(
                { error: 'Invalid or expired access token' },
                { status: 404 }
            );
        }

        // Set used_at on first access (but keep token valid)
        if (!tokenData.used_at) {
            await supabaseAdmin
                .from('nominee_access_tokens')
                .update({ used_at: now })
                .eq('id', tokenData.id);

            // Log successful initial access
            await supabaseAdmin.from('audit_logs').insert({
                user_id: tokenData.user_id,
                event_type: 'NOMINEE_ACCESS_SUCCESS',
                description: `Nominee has successfully accessed the portfolio using a secure token.`,
                metadata: { token_id: tokenData.id, nominee_id: tokenData.nominee_id }
            });
        }

        // Fetch nominee name
        const { data: nomineeData } = await supabaseAdmin
            .from('nominees')
            .select('name')
            .eq('id', tokenData.nominee_id)
            .single();

        const nomineeName = nomineeData?.name || 'Nominee';

        // Fetch user profile
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name')
            .eq('id', tokenData.user_id)
            .single();

        // Fetch all financial data securely
        const [
            { data: bankData },
            { data: assetsData },
            { data: belongingsData },
            { data: receivablesData },
            { data: liabilitiesData }
        ] = await Promise.all([
            supabaseAdmin.from('bank_accounts').select('*').eq('user_id', tokenData.user_id),
            supabaseAdmin.from('assets').select('*').eq('user_id', tokenData.user_id),
            supabaseAdmin.from('belongings').select('*').eq('user_id', tokenData.user_id),
            supabaseAdmin.from('receivables').select('*').eq('user_id', tokenData.user_id),
            supabaseAdmin.from('liabilities').select('*').eq('user_id', tokenData.user_id)
        ]);

        const bankAccounts = (bankData || []).map((r: any) => decryptNumericFields(r, ['current_balance']));
        const assets = (assetsData || []).map((r: any) => decryptNumericFields(r, ['current_market_value', 'purchase_value']));
        const belongings = (belongingsData || []).map((r: any) => decryptNumericFields(r, ['quantity', 'purchase_value', 'current_estimated_value']));
        const receivables = (receivablesData || []).map((r: any) => decryptNumericFields(r, ['principal_amount', 'outstanding_amount']));
        const liabilities = (liabilitiesData || []).map((r: any) => decryptNumericFields(r, ['principal_amount', 'outstanding_amount', 'emi_amount']));

        const totalBank = bankAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
        const totalAssets = assets.reduce((sum, a) => sum + (a.current_market_value || 0), 0);
        const totalBelongings = belongings.reduce((sum, b) => sum + (b.current_estimated_value || 0), 0);
        const totalReceivables = receivables.reduce((sum, r) => sum + (r.outstanding_amount || 0), 0);
        const totalLiabilities = liabilities.reduce((sum, l) => sum + (l.outstanding_amount || 0), 0);

        const totalValue = totalBank + totalAssets + totalBelongings + totalReceivables;
        const totalInvested = totalAssets; // rough proxy

        // Fetch nominees (names + relationships only, NO emails)
        const { data: nominees } = await supabaseAdmin
            .from('nominees')
            .select('id, name, relationship')
            .eq('user_id', tokenData.user_id)
            .order('created_at', { ascending: false });

        return NextResponse.json({
            valid: true,
            nomineeName,
            expiresAt: tokenData.expires_at,
            profile: {
                fullName: profile?.full_name || 'Unknown User'
            },
            summary: {
                totalInvested,
                totalValue,
                totalLiabilities,
                nomineesCount: nominees?.length ?? 0
            },
            portfolio: {
                bankAccounts,
                assets,
                belongings,
                receivables,
                liabilities
            },
            nominees: (nominees ?? []).map(n => ({
                id: n.id,
                name: n.name,
                relationship: n.relationship
            }))
        });
    } catch (error) {
        console.error('Nominee access error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
