import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API Key from environment
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface NotificationPayload {
    userId: string;
    stage: 1 | 2 | 3 | 4;
    email?: string;
    phone?: string;
    details?: any;
}

export async function sendInactivityNotification(payload: NotificationPayload) {
    const { stage, email, details } = payload;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'merndevloops@gmail.com';
    
    if (!email) {
        console.warn(`[Notification Service] No email provided for Stage ${stage}, skipping.`);
        return { success: false, error: 'No email provided' };
    }

    let subject = "";
    let html = "";
    
    switch (stage) {
        case 1:
            subject = "Action Required: Inactivity Reminder";
            html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0f172a;">Inactivity Reminder</h2>
                    <p>Hello,</p>
                    <p>We noticed you haven't logged into your <strong>Investment Intelligence</strong> account for a while.</p>
                    <p>Please log in soon to reset your inactivity timer and ensure your account remains active.</p>
                    <div style="margin-top: 20px;">
                        <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Log In Now</a>
                    </div>
                </div>
            `;
            break;
        case 2:
            subject = "Second Reminder: Potential Account Inactivity";
            html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0f172a;">Second Reminder</h2>
                    <p>Hello,</p>
                    <p>Your account is approaching its inactivity threshold. If you do not log in soon, your designated nominees may be granted emergency access to your portfolio.</p>
                    <p>Please log in to confirm you are still active.</p>
                </div>
            `;
            break;
        case 3:
            subject = "⚠️ URGENT: Nominee Access Activation Warning";
            html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc2626;">Emergency Access Warning</h2>
                    <p>Hello,</p>
                    <p>Your account is highly inactive. Your designated nominees will be granted emergency access to your portfolio information in very shortly.</p>
                    <p><strong>Log in immediately to prevent this action.</strong></p>
                </div>
            `;
            break;
        case 4:
            // Notify Host
            const hostMsg = {
                to: email,
                from: fromEmail,
                subject: "Nominee Access Successfully Granted",
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #0f172a;">Emergency Access Granted</h2>
                        <p>Hello,</p>
                        <p>Your portfolio access has been granted to your designated nominees due to reached inactivity threshold.</p>
                    </div>
                `
            };
            try {
                await sgMail.send(hostMsg);
            } catch (error) {
                console.error("SendGrid Host Notification Error:", error);
            }

            // Notify Nominees
            if (details?.nominees && Array.isArray(details.nominees)) {
                for (const nominee of details.nominees) {
                    if (!nominee.email) continue;
                    
                    const guidance = getNomineeGuidance(nominee.verification_method);
                    const accessLink = `${process.env.NEXT_PUBLIC_SITE_URL}/nominee-portal/${nominee.id}`;
                    
                    const nomineeMsg = {
                        to: nominee.email,
                        from: fromEmail,
                        subject: "Emergency Portfolio Access Granted",
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                                <h1 style="color: #10b981;">Emergency Access</h1>
                                <p>Hello ${nominee.name},</p>
                                <p>You have been granted emergency read-only access to a portfolio managed via <strong>Investment Intelligence</strong>.</p>
                                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 0; font-weight: bold;">Instructions:</p>
                                    <p style="margin: 8px 0;">${guidance}</p>
                                </div>
                                <div style="margin-top: 30px;">
                                    <a href="${accessLink}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify & Access Portfolio</a>
                                </div>
                                <p style="font-size: 12px; color: #64748b; margin-top: 40px;">
                                    This link is secure and will expire after successful verification. Please do not share this link.
                                </p>
                            </div>
                        `
                    };
                    try {
                        await sgMail.send(nomineeMsg);
                    } catch (error) {
                        console.error(`SendGrid Nominee Notification Error (${nominee.email}):`, error);
                    }
                }
            }
            return { success: true };
    }

    if (subject && html) {
        const msg = {
            to: email,
            from: fromEmail,
            subject: subject,
            html: html,
        };
        try {
            await sgMail.send(msg);
            return { success: true };
        } catch (error) {
            console.error("SendGrid Error:", error);
            return { success: false, error };
        }
    }
    
    return { success: true };
}

/**
 * Generates dynamic guidance based on configured verification method
 */
function getNomineeGuidance(method: string): string {
    switch (method) {
        case 'phone_aadhaar':
            return "Please provide your Aadhaar card number and registered phone number to verify your identity.";
        case 'phone_pan_email':
            return "Please provide your PAN card number, registered mobile number, and email to verify your identity.";
        case 'phone_only':
        default:
            return "Please provide your registered phone number. An OTP will be sent for verification.";
    }
}
