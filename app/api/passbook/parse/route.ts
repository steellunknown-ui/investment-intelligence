import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server';
import { parseTransaction, generateFingerprint } from '@/services/smsParser';

export async function POST(request: Request) {
    try {
        const supabase = createSupabaseServerClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { raw_text, source, package_name } = body;

        if (!raw_text) {
            return NextResponse.json({ error: 'Missing raw_text' }, { status: 400 });
        }

        // 1. Parse — pass source so parser can use package as a hint
        const parsed = parseTransaction(raw_text, source);

        if (!parsed.is_transaction) {
            return NextResponse.json({ success: false, reason: "not_a_transaction" }, { status: 200 });
        }

        // 2. Generate Fingerprint for deduplication
        const fingerprint = generateFingerprint(parsed);

        // 3. Check for duplicates in Supabase
        const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('fingerprint', fingerprint)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ success: false, reason: "duplicate", fingerprint }, { status: 200 });
        }

        // 4. Save to Database (Set is_verified to true for fully automatic)
        const { data, error } = await supabase
            .from('transactions')
            .insert({
                user_id:          user.id,
                source:           source ?? 'unknown',
                package_name:     package_name ?? null,
                raw_text:         raw_text,
                amount:           parsed.amount,
                type:             parsed.type,
                method:           parsed.method,
                merchant:         parsed.merchant,
                bank:             parsed.bank,
                account_last4:    parsed.account_last4,
                upi_id:           parsed.upi_id,
                balance_after:    parsed.balance_after,
                transaction_ref:  parsed.transaction_ref,
                transaction_date: parsed.transaction_date,
                category:         parsed.category,
                fingerprint:      fingerprint,
                is_verified:      true,
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase Insert Error:', error);
            return NextResponse.json({ success: false, reason: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, transaction: data }, { status: 201 });

    } catch (error: any) {
        console.error('Passbook API Exception:', error);
        return NextResponse.json({ success: false, reason: error.message }, { status: 500 });
    }
}
