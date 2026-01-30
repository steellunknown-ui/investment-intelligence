import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabase/supabase-server";
import { verifyOTP } from "@/lib/otp";
import { updateLastActivity } from "@/src/lib/activity";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    updateLastActivity(supabase, user.id);

    const { otp } = await request.json();
    if (!otp || otp.length !== 6) {
      return NextResponse.json({ error: "Invalid OTP format" }, { status: 400 });
    }

    const documentId = params.id;

    // Find latest valid OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from("document_view_otps")
      .select("id, otp_hash, expires_at")
      .eq("user_id", user.id)
      .eq("document_id", documentId)
      .is("verified_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      return NextResponse.json({ error: "No valid OTP found" }, { status: 400 });
    }

    // Verify OTP
    if (!verifyOTP(otp, otpRecord.otp_hash)) {
      // Check failed attempts for security
      const { data: failedAttempts } = await supabase
        .from("document_view_otps")
        .select("id")
        .eq("user_id", user.id)
        .eq("document_id", documentId)
        .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());

      if (failedAttempts && failedAttempts.length >= 5) {
        return NextResponse.json({ error: "Too many failed attempts. Please wait." }, { status: 429 });
      }

      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Mark OTP as verified
    const { error: updateError } = await supabase
      .from("document_view_otps")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", otpRecord.id);

    if (updateError) {
      console.error("Failed to mark OTP as verified:", updateError);
      return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      unlocked: true
    });

  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}