import sgMail from "@sendgrid/mail"

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

/**
 * Reusable helper to send emails safely via SendGrid.
 * 
 * @param to Recipient email address
 * @param subject Email subject line
 * @param text Plain text message body
 */
export async function sendEmail(to: string, subject: string, text: string) {
    try {
        const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM;
        
        if (!fromEmail) {
            throw new Error("Missing sender email configuration (SENDGRID_FROM_EMAIL or EMAIL_FROM)");
        }

        const msg = {
            to,
            from: fromEmail,
            subject,
            text,
            // You can also add html template if required in future
        }

        const response = await sgMail.send(msg)
        return { success: true, response }

    } catch (error) {
        console.error("SendGrid Email Send Failed:", error)
        return { success: false, error }
    }
}
