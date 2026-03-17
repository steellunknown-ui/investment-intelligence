import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabase/supabase-server";

// GET /api/family/[id]/summary - Get aggregated module data for a family member
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

        const memberUserId = params.id;

        // 1. Verify that the current user has access to this family member
        const { data: familyLink, error: linkError } = await supabase
            .from("family_members")
            .select("id")
            .eq("owner_id", user.id)
            .eq("member_user_id", memberUserId)
            .single();

        if (linkError || !familyLink) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // 2. Fetch Module Summaries using Promise.all for parallelism
        const [
            bankingResponse,
            assetsResponse,
            belongingsResponse,
            receivablesResponse,
            liabilitiesResponse,
            lastLoginResponse
        ] = await Promise.all([
            // Banking
            supabase
                .from("bank_accounts")
                .select("current_balance")
                .eq("user_id", memberUserId)
                .eq("status", "active"),
            // Assets
            supabase
                .from("assets")
                .select("current_market_value")
                .eq("user_id", memberUserId),
            // Belongings
            supabase
                .from("belongings")
                .select("current_estimated_value")
                .eq("user_id", memberUserId)
                .in("status", ["in_possession", "in_locker"]),
            // Receivables
            supabase
                .from("receivables")
                .select("outstanding_amount")
                .eq("user_id", memberUserId)
                .in("status", ["pending", "partial"]),
            // Liabilities
            supabase
                .from("liabilities")
                .select("outstanding_amount")
                .eq("user_id", memberUserId)
                .eq("status", "active"),
            // Last Login
            supabase
                .from("audit_logs")
                .select("created_at")
                .eq("user_id", memberUserId)
                .eq("action", "login")
                .order("created_at", { ascending: false })
                .limit(1)
                .single()
        ]);

        // Calculate Totals safely
        const bankingTotal = (bankingResponse.data || []).reduce((sum, item) => sum + Number(item.current_balance || 0), 0);
        const assetsTotal = (assetsResponse.data || []).reduce((sum, item) => sum + Number(item.current_market_value || 0), 0);
        const belongingsTotal = (belongingsResponse.data || []).reduce((sum, item) => sum + Number(item.current_estimated_value || 0), 0);
        const receivablesTotal = (receivablesResponse.data || []).reduce((sum, item) => sum + Number(item.outstanding_amount || 0), 0);
        const liabilitiesTotal = (liabilitiesResponse.data || []).reduce((sum, item) => sum + Number(item.outstanding_amount || 0), 0);

        const summary = {
            banking: {
                count: bankingResponse.data?.length || 0,
                total: bankingTotal
            },
            assets: {
                count: assetsResponse.data?.length || 0,
                total: assetsTotal
            },
            belongings: {
                count: belongingsResponse.data?.length || 0,
                total: belongingsTotal
            },
            receivables: {
                count: receivablesResponse.data?.length || 0,
                total: receivablesTotal
            },
            liabilities: {
                count: liabilitiesResponse.data?.length || 0,
                total: liabilitiesTotal
            },
            lastLoginAt: lastLoginResponse.data?.created_at || null
        };

        return NextResponse.json({ summary });
    } catch (error) {
        console.error("Family summary GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
