import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server';
import { parseTransaction } from '@/services/smsParser';
import crypto from 'crypto';

function autoCategorize(merchant: string | null, method: string | null): string {
    if (method === 'atm') return 'Cash Withdrawal';
    if (method === 'emi') return 'EMI';
    
    if (!merchant) return 'Others';
    
    const m = merchant.toLowerCase();
    if (m.includes('swiggy') || m.includes('zomato')) return 'Food & Dining';
    if (m.includes('amazon') || m.includes('flipkart') || m.includes('myntra') || m.includes('meesho')) return 'Shopping';
    if (m.includes('bpcl') || m.includes('hpcl') || m.includes('shell') || m.includes('iocl') || m.includes('petrol')) return 'Fuel';
    if (m.includes('apollo') || m.includes('medplus') || m.includes('pharmeasy') || m.includes('netmeds')) return 'Healthcare';
    if (m.includes('netflix') || m.includes('spotify') || m.includes('hotstar') || m.includes('prime')) return 'Entertainment';
    if (m.includes('uber') || m.includes('ola') || m.includes('rapido')) return 'Transport';
    if (m.includes('electricity') || m.includes('water') || m.includes('gas') || m.includes('broadband')) return 'Utilities';
    
    return 'Others';
}

function generateFingerprint(amount: number, bank: string | null, date: string, ref: string | null, merchant: string | null): string {
    // Keep date to YYYY-MM-DD for hashing to avoid timezone/time differences in SMS
    const dateOnly = date ? date.split('T')[0] : '';
    const uniqueKey = ref ? ref : (merchant || '');
    const raw = `${amount}_${bank || ''}_${dateOnly}_${uniqueKey}`.toLowerCase();
    return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function POST(request: Request) {
    try {
        const supabase = createSupabaseServerClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { raw_text, source } = body;

        if (!raw_text) {
            return NextResponse.json({ error: 'Missing raw_text' }, { status: 400 });
        }

        // 1. Call AI Parser
        const parsed = await parseTransaction(raw_text, source || 'unknown');

        if (!parsed.is_transaction || !parsed.amount || !parsed.type) {
            return NextResponse.json({ message: 'Not a transaction', parsed }, { status: 200 });
        }

        // 2. Auto-Categorize
        const category = autoCategorize(parsed.merchant, parsed.method);

        // 3. Deduplication Fingerprint
        const fingerprint = generateFingerprint(
            parsed.amount,
            parsed.bank,
            parsed.transaction_date,
            parsed.transaction_ref,
            parsed.merchant
        );

        // 4. Insert into Database
        const transactionData = {
            user_id: user.id,
            source: source.includes('SMS') ? 'sms' : (source === 'Auto-Detected' ? 'auto' : 'notification'),
            raw_text,
            amount: parsed.amount,
            type: parsed.type,
            method: parsed.method || 'unknown',
            merchant: parsed.merchant,
            bank: parsed.bank,
            account_last4: parsed.account_last4,
            upi_id: parsed.upi_id,
            balance_after: parsed.balance_after,
            transaction_ref: parsed.transaction_ref,
            transaction_date: parsed.transaction_date || new Date().toISOString(),
            fingerprint,
            is_verified: false,
            category,
            notes: null
        };

        const { data, error } = await supabase
            .from('transactions')
            .insert(transactionData)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return NextResponse.json({ message: 'Duplicate transaction skipped', fingerprint }, { status: 200 });
            }
            console.error('Insert transaction error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Transaction parsed and saved', transaction: data }, { status: 201 });

    } catch (error: any) {
        console.error('Passbook Parse API Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
