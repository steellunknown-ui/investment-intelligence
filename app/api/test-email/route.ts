import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/src/lib/supabase/supabase-server'
import { sendEmail } from '@/src/lib/resend'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await sendEmail({
      to: user.email!,
      subject: 'Resend Test Email - Vault',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Personal Finance Vault</h2>
          <p>Hello ${user.email},</p>
          <p>If you received this, Resend is configured correctly.</p>
          <p style="color: #666; font-size: 14px;">This is a test email from your vault system.</p>
        </div>
      `,
      text: 'If you received this, Resend is configured correctly.'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}