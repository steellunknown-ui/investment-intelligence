import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server';
import { parseTransaction, generateFingerprint } from '@/services/smsParser';
import { parseTransactionWithGroq } from '@/services/groqParser';

export async function POST(request: Request) {
    try {
        const supabase = createSupabaseServerClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { raw_text, source, package_name, sender } = body;

        if (!raw_text) {
            return NextResponse.json({ error: 'Missing raw_text' }, { status: 400 });
        }

        // 1. Tier 1: Fast Universal Regex Parser v5.0 (0ms, zero API cost)
        let parsed = parseTransaction(raw_text, source, sender || package_name);

        // 2. Tier 2: Groq AI Fallback
        // If Regex missed the transaction or key metadata, and GROQ_API_KEY is configured
        if ((!parsed.is_transaction || !parsed.merchant || parsed.method === 'unknown') && process.env.GROQ_API_KEY) {
            try {
                const groqResult = await parseTransactionWithGroq(raw_text, source, sender || package_name);
                if (groqResult && groqResult.is_transaction) {
                    parsed = groqResult;
                }
            } catch (aiErr) {
                console.warn('Groq parser fallback error (proceeding with regex):', aiErr);
            }
        }

        if (!parsed.is_transaction) {
            return NextResponse.json({ success: false, reason: "not_a_transaction" }, { status: 200 });
        }

        // 3. Exact Fingerprint Check
        const fingerprint = generateFingerprint(parsed);
        const { data: exactMatch } = await supabase
            .from('transactions')
            .select('id')
            .eq('fingerprint', fingerprint)
            .maybeSingle();

        if (exactMatch) {
            return NextResponse.json({ success: false, reason: "duplicate", fingerprint }, { status: 200 });
        }

        // 4. Temporal Sliding Window Reconciliation (5-Minute Window)
        // Eliminates multi-source duplicates (e.g. Google Pay notification arrived, then Bank SMS arrived)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: recentList } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('amount', parsed.amount)
            .eq('type', parsed.type)
            .gte('created_at', fiveMinutesAgo)
            .order('created_at', { ascending: false });

        const candidate = recentList?.find(t => {
            if (parsed.transaction_ref && t.transaction_ref && parsed.transaction_ref === t.transaction_ref) {
                return true;
            }
            if (!t.transaction_ref || !parsed.transaction_ref) {
                const sameAccount = !t.account_last4 || !parsed.account_last4 || t.account_last4 === parsed.account_last4;
                return sameAccount;
            }
            return false;
        });

        if (candidate) {
            // Merge & enrich existing row instead of creating duplicate
            const updates: Record<string, any> = {};

            if ((!candidate.bank || candidate.bank === 'Google Pay' || candidate.bank === 'GPay') && parsed.bank) {
                updates.bank = parsed.bank;
            }
            if (!candidate.account_last4 && parsed.account_last4) {
                updates.account_last4 = parsed.account_last4;
            }
            if (!candidate.balance_after && parsed.balance_after) {
                updates.balance_after = parsed.balance_after;
            }
            if (!candidate.transaction_ref && parsed.transaction_ref) {
                updates.transaction_ref = parsed.transaction_ref;
            }
            if (!candidate.upi_id && parsed.upi_id) {
                updates.upi_id = parsed.upi_id;
            }
            if ((!candidate.merchant || candidate.merchant === 'Unknown Merchant') && parsed.merchant) {
                updates.merchant = parsed.merchant;
            }
            if (parsed.instrument && (!candidate.instrument || candidate.instrument === 'UPI (Bank Account)')) {
                updates.instrument = parsed.instrument;
            }
            if (parsed.card_network && !candidate.card_network) {
                updates.card_network = parsed.card_network;
            }
            if (raw_text && candidate.raw_text && !candidate.raw_text.includes(raw_text)) {
                updates.raw_text = `${candidate.raw_text}\n---\n${raw_text}`;
            }

            if (Object.keys(updates).length > 0) {
                await supabase.from('transactions').update(updates).eq('id', candidate.id);
            }

            return NextResponse.json({
                success: true,
                action: "merged",
                message: "Merged with recent matching transaction",
                transaction_id: candidate.id
            }, { status: 200 });
        }

        // 5. Save New Transaction to Database
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
                instrument:       parsed.instrument ?? 'UPI (Bank Account)',
                card_network:     parsed.card_network ?? null,
                raw_sender:       sender ?? package_name ?? null,
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

        return NextResponse.json({ success: true, action: "created", transaction: data }, { status: 201 });

    } catch (error: any) {
        console.error('Passbook API Exception:', error);
        return NextResponse.json({ success: false, reason: error.message }, { status: 500 });
    }
}
