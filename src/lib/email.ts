/**
 * Email Service
 * 
 * In development, emails are logged to console.
 * In production, integrate with a service like:
 * - Resend (https://resend.com)
 * - SendGrid (https://sendgrid.com)
 * - Mailgun (https://mailgun.com)
 * - AWS SES
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private isDevelopment = process.env.NODE_ENV !== "production";

  async send(options: EmailOptions): Promise<boolean> {
    if (this.isDevelopment) {
      // Log email to console in development
      console.log("\n========== EMAIL ==========");
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Content:\n${options.text || options.html}`);
      console.log("============================\n");
      return true;
    }

    // Production: Use your preferred email service
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'TutorHub <noreply@tutorhub.com>',
    //   to: options.to,
    //   subject: options.subject,
    //   html: options.html,
    // });

    console.log("Email would be sent in production:", options.to, options.subject);
    return true;
  }

  async sendVerificationEmail(email: string, firstName: string, verificationUrl: string): Promise<boolean> {
    const subject = "Verify your TutorHub email address";
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎓 TutorHub</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Welcome, ${firstName}!</h2>
            
            <p>Thanks for signing up for TutorHub. Please verify your email address to get started.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              This link will expire in 24 hours. If you didn't create an account with TutorHub, you can safely ignore this email.
            </p>
            
            <p style="color: #6b7280; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:
              <br>
              <a href="${verificationUrl}" style="color: #6366f1; word-break: break-all;">${verificationUrl}</a>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} TutorHub. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
Welcome to TutorHub, ${firstName}!

Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with TutorHub, you can safely ignore this email.
    `;

    return this.send({ to: email, subject, html, text });
  }

  async sendPasswordResetEmail(email: string, firstName: string, resetUrl: string): Promise<boolean> {
    const subject = "Reset your TutorHub password";
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your password</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎓 TutorHub</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
            
            <p>Hi ${firstName},</p>
            
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              This link will expire in 24 hours. If you didn't request a password reset, you can safely ignore this email.
            </p>
            
            <p style="color: #6b7280; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:
              <br>
              <a href="${resetUrl}" style="color: #6366f1; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} TutorHub. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
Hi ${firstName},

We received a request to reset your TutorHub password. Click the link below to create a new password:

${resetUrl}

This link will expire in 24 hours.

If you didn't request a password reset, you can safely ignore this email.
    `;

    return this.send({ to: email, subject, html, text });
  }

  async sendBookingRequestEmail(
    tutorEmail: string, 
    tutorName: string, 
    studentName: string, 
    subject: string, 
    date: string, 
    time: string,
    bookingUrl: string
  ): Promise<boolean> {
    const emailSubject = `New booking request from ${studentName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎓 TutorHub</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">New Booking Request! 📚</h2>
            
            <p>Hi ${tutorName},</p>
            
            <p>You have a new tutoring session request from <strong>${studentName}</strong>.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${bookingUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                View & Respond to Request
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Please respond to this request within 48 hours.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.send({ to: tutorEmail, subject: emailSubject, html });
  }

  async sendBookingApprovedEmail(
    studentEmail: string, 
    studentName: string, 
    tutorName: string, 
    subject: string, 
    date: string, 
    time: string,
    paymentUrl: string
  ): Promise<boolean> {
    const emailSubject = `Your booking with ${tutorName} has been approved!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Booking Approved!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Great news, ${studentName}!</h2>
            
            <p><strong>${tutorName}</strong> has approved your tutoring session request.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${paymentUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Complete Payment
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Please complete your payment to confirm the booking.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.send({ to: studentEmail, subject: emailSubject, html });
  }
}

export const emailService = new EmailService();
