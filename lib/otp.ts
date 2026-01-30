import crypto from 'crypto';
import { sendEmail } from '@/src/lib/resend';

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export function verifyOTP(otp: string, hash: string): boolean {
  return hashOTP(otp) === hash;
}

export async function sendOTPEmail(email: string, otp: string, documentName: string): Promise<boolean> {
  try {
    // For development - log OTP to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 OTP for ${email}: ${otp} (Document: ${documentName})`);
    }

    await sendEmail({
      to: email,
      subject: 'Document Access OTP - Personal Finance Vault',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Personal Finance Vault</h2>
          <p>You requested to view the document: <strong>${documentName}</strong></p>
          <div style="background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; color: #666;">Your OTP Code:</p>
            <h1 style="color: #007bff; font-size: 36px; margin: 0; letter-spacing: 4px;">${otp}</h1>
          </div>
          <p><strong>Valid for 2 minutes</strong></p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
      text: `Personal Finance Vault\n\nDocument Access OTP: ${otp}\n\nDocument: ${documentName}\nValid for 2 minutes\n\nIf you didn't request this, ignore this email.`
    });

    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
}