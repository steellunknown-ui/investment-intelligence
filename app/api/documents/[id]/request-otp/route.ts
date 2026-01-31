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

    // Store document info for audit trail
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: insertError } = await supabase
      .from("document_view_otps")
      .insert({
        user_id: user.id,
        document_id: documentId,
        otp_hash: "supabase_otp", // Marker to indicate Supabase OTP was used
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Failed to log OTP request:", insertError);
      // Continue anyway - this is just for audit
    }

    // Use Supabase's built-in OTP email system
    // This uses Supabase's email infrastructure which works for ALL email addresses
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: user.email!,
      options: {
        shouldCreateUser: false, // Don't create new user, just send OTP to existing user
      }
    });

    if (otpError) {
      console.error("Supabase OTP error:", otpError);
      return NextResponse.json({
        error: "Failed to send OTP. Please try again."
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email",
      documentId: documentId // Return for verification step
    });

  } catch (error) {
    console.error("Request OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}