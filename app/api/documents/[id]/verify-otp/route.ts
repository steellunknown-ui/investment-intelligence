import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabase/supabase-server";
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

    // Verify the OTP using Supabase's built-in verification
    // This validates the OTP that was sent via Supabase's email system
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: user.email!,
      token: otp,
      type: 'email'
    });

    if (verifyError) {
      console.error("Supabase OTP verification error:", verifyError);

      // Check for rate limiting
      if (verifyError.message?.includes("rate")) {
        return NextResponse.json({ error: "Too many attempts. Please wait." }, { status: 429 });
      }

      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    if (!verifyData.session) {
      return NextResponse.json({ error: "OTP verification failed" }, { status: 400 });
    }

    // Mark in our audit log that verification was successful
    const { error: updateError } = await supabase
      .from("document_view_otps")
      .update({ verified_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("document_id", documentId)
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (updateError) {
      console.error("Failed to update audit log:", updateError);
      // Continue anyway - the OTP was verified successfully
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