import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabase/supabase-server";

// GET /api/banking/[id]/transactions - Get all transactions for a bank account
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify account ownership
        const { data: account, error: accountError } = await supabase
            .from("bank_accounts")
            .select("id")
            .eq("id", params.id)
            .eq("user_id", user.id)
            .single();

        if (accountError || !account) {
            return NextResponse.json({ error: "Account not found or access denied" }, { status: 404 });
        }

        const { data: transactions, error } = await supabase
            .from("bank_transactions")
            .select("*")
            .eq("account_id", params.id)
            .order("transaction_date", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching transactions:", error);
            return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
        }

        return NextResponse.json({ transactions });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

// POST /api/banking/[id]/transactions - Add a new transaction
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Verify account ownership
        const { data: account, error: accountError } = await supabase
            .from("bank_accounts")
            .select("id, balance")
            .eq("id", params.id)
            .eq("user_id", user.id)
            .single();

        if (accountError || !account) {
            return NextResponse.json({ error: "Account not found or access denied" }, { status: 404 });
        }

        // Calculate new balance based on transaction type
        const amount = parseFloat(body.amount);
        let newBalance = Number(account.balance);
        if (body.type === 'credit') {
            newBalance += amount;
        } else if (body.type === 'debit') {
            newBalance -= amount;
        }

        const transactionData = {
            user_id: user.id,
            account_id: params.id,
            amount: amount,
            type: body.type,
            transaction_date: body.transaction_date,
            description: body.description,
            reference_number: body.reference_number,
            balance_after: newBalance
        };

        const { data: transaction, error } = await supabase
            .from("bank_transactions")
            .insert([transactionData])
            .select()
            .single();

        if (error) {
            console.error("Error adding transaction:", error);
            return NextResponse.json({ error: "Failed to add transaction" }, { status: 500 });
        }

        return NextResponse.json({ transaction }, { status: 201 });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
