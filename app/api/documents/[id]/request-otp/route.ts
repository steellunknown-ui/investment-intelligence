import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabase/supabase-server";
import { generateOTP, hashOTP, sendOTPEmail } from "@/lib/otp";
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

    const documentId = params.id;

    // Verify document belongs to user
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, title, file_name")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Rate limiting - max 3 OTP requests per document per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentOTPs } = await supabase
      .from("document_view_otps")
      .select("id")
      .eq("user_id", user.id)
      .eq("document_id", documentId)
      .gte("created_at", tenMinutesAgo);

    if (recentOTPs && recentOTPs.length >= 3) {
      return NextResponse.json({ error: "Too many OTP requests. Please wait." }, { status: 429 });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Store OTP
    const { error: insertError } = await supabase
      .from("document_view_otps")
      .insert({
        user_id: user.id,
        document_id: documentId,
        otp_hash: otpHash,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Failed to store OTP:", insertError);
      return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
    }

    // Send OTP email
    const emailSent = await sendOTPEmail(
      user.email!,
      otp,
      document.title || document.file_name
    );

    if (!emailSent) {
      return NextResponse.json({ error: "Failed to send OTP email" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email"
    });

  } catch (error) {
    console.error("Request OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}