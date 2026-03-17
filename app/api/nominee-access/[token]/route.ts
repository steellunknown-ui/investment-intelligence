import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase/admin';

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

        // Fetch holdings
        const { data: holdings } = await supabaseAdmin
            .from('holdings')
            .select('id, symbol, name, asset_type, quantity, avg_buy_price, created_at')
            .eq('user_id', tokenData.user_id)
            .order('created_at', { ascending: false });

        // Calculate dashboard summary
        let totalInvested = 0;
        const holdingsCount = holdings?.length ?? 0;

        if (holdings && holdings.length > 0) {
            totalInvested = holdings.reduce((sum, h) => {
                const qty = Number(h.quantity) || 0;
                const price = Number(h.avg_buy_price) || 0;
                return sum + (qty * price);
            }, 0);
        }

        const totalValue = totalInvested; // No live pricing yet

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
                holdingsCount,
                nomineesCount: nominees?.length ?? 0
            },
            holdings: holdings ?? [],
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
