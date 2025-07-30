import debug from 'debug';

const log = debug('superlytics:email');

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailTemplateData {
  username: string;
  token: string;
  appName: string;
  appUrl: string;
}

class EmailService {
  private apiKey: string;
  private fromAddress: string;
  private appName: string;
  private appUrl: string;
  private apiBaseUrl: string;

  constructor() {
    this.apiKey = process.env.EMAILIT_API_KEY || '';
    this.fromAddress = process.env.FROM_EMAIL || 'noreply@superlytics.co';
    this.appName = process.env.APP_NAME || 'SuperLytics';
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://superlytics.co';
    this.apiBaseUrl = 'https://api.emailit.com';

    if (!this.apiKey) {
      log('Warning: EMAILIT_API_KEY not configured. Email functionality will be disabled.');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.apiKey) {
      log('Email service not configured. Skipping email send.');
      return false;
    }

    try {
      const emailPayload = {
        from: `${this.appName} <${this.fromAddress}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        ...(options.text && { text: options.text }),
      };

      const response = await fetch(`${this.apiBaseUrl}/v1/emails`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      if (!response.ok) {
        const error = await response.text();
        log('Email send failed:', response.status, error);
        return false;
      }

      const result = await response.json();
      log('Email sent successfully via EmailIt:', result);
      return true;
    } catch (error) {
      log('Email send error:', error);
      return false;
    }
  }

  async sendPasswordReset(email: string, resetToken: string, username: string): Promise<boolean> {
    const resetUrl = `${this.appUrl}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - SuperLytics</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              line-height: 1.6; 
              color: #333;
              margin: 0;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: #ffffff; 
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .logo { 
              font-size: 32px; 
              font-weight: bold; 
              color: #333; 
              margin-bottom: 40px;
              text-align: center;
            }
            .greeting {
              font-size: 18px;
              color: #333;
              margin-bottom: 20px;
            }
            .message { 
              font-size: 16px; 
              color: #333; 
              margin-bottom: 40px; 
              line-height: 1.6;
            }
            .cta-button { 
              display: inline-block; 
              background: #dc3545;
              color: #ffffff; 
              text-decoration: none; 
              padding: 15px 30px; 
              border-radius: 6px; 
              font-weight: 500; 
              font-size: 16px;
              margin: 20px 0;
            }
            .security-note { 
              font-size: 14px;
              color: #666; 
              margin-top: 30px;
              line-height: 1.5;
            }
            .security-note strong {
              color: #333;
            }
            .footer { 
              font-size: 14px;
              color: #666; 
              margin-top: 40px; 
              padding-top: 20px;
              border-top: 1px solid #eee;
              text-align: center;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">SuperLytics</div>
            
            <div class="greeting">Hi ${username},</div>
            
            <div class="message">
              We received a request to reset your password. Click the button below to reset it:
            </div>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="cta-button">Reset Password</a>
            </div>
            
            <div class="security-note">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons.<br><br>
              If you didn't request this password reset, please ignore this email.
            </div>
            
            <div class="footer">
              © ${new Date().getFullYear()} SuperLytics. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Reset Your Password

Hi ${username},

We received a request to reset your password for your ${this.appName} account.

Reset your password by visiting this link:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email.

© ${new Date().getFullYear()} ${this.appName}
    `;

    return this.sendEmail({
      to: email,
      subject: `Reset your ${this.appName} password`,
      html,
      text,
    });
  }

  async sendEmailVerification(
    email: string,
    verificationToken: string,
    username: string,
  ): Promise<boolean> {
    const verificationUrl = `${this.appUrl}/verify-email?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - SuperLytics</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              line-height: 1.6; 
              color: #333;
              margin: 0;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: #ffffff; 
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .logo { 
              font-size: 32px; 
              font-weight: bold; 
              color: #333; 
              margin-bottom: 40px;
              text-align: center;
            }
            .greeting {
              font-size: 18px;
              color: #333;
              margin-bottom: 20px;
            }
            .message { 
              font-size: 16px; 
              color: #333; 
              margin-bottom: 40px; 
              line-height: 1.6;
            }
            .cta-button { 
              display: inline-block; 
              background: #28a745;
              color: #ffffff; 
              text-decoration: none; 
              padding: 15px 30px; 
              border-radius: 6px; 
              font-weight: 500; 
              font-size: 16px;
              margin: 20px 0;
            }
            .alt-text {
              font-size: 14px;
              color: #666;
              margin: 30px 0 15px 0;
            }
            .url-box {
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              padding: 15px;
              border-radius: 4px;
              word-break: break-all;
              font-size: 14px;
              color: #007bff;
              margin-bottom: 30px;
            }
            .next-steps {
              background: #e8f5e8;
              border: 1px solid #c3e6c3;
              padding: 20px;
              border-radius: 6px;
              margin: 30px 0;
            }
            .next-steps-title {
              font-size: 16px;
              font-weight: 600;
              color: #155724;
              margin-bottom: 15px;
            }
            .next-steps-content {
              font-size: 14px;
              color: #155724;
              margin-bottom: 10px;
            }
            .next-steps ul {
              margin: 0;
              padding-left: 20px;
            }
            .next-steps li {
              color: #155724;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .note {
              font-size: 14px;
              color: #666;
              margin: 30px 0;
            }
            .note strong {
              color: #333;
            }
            .footer { 
              font-size: 14px;
              color: #666; 
              margin-top: 40px; 
              padding-top: 20px;
              border-top: 1px solid #eee;
              text-align: center;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">SuperLytics</div>
            
            <div class="greeting">Hi ${username},</div>
            
            <div class="message">
              Thank you for signing up! To get started with your analytics dashboard, please verify your email address by clicking the button below:
            </div>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="cta-button">Verify Email Address</a>
            </div>
            
            <div class="alt-text">If the button doesn't work, you can copy and paste this link into your browser:</div>
            <div class="url-box">${verificationUrl}</div>
            
            <div class="next-steps">
              <div class="next-steps-title">🚀 What's next?</div>
              <div class="next-steps-content">Once you verify your email, you'll be able to:</div>
              <ul>
                <li>Set up your first website for tracking</li>
                <li>Access your analytics dashboard</li>
                <li>Configure privacy-focused analytics</li>
              </ul>
            </div>
            
            <div class="note">
              <strong>Note:</strong> This verification link will expire in 24 hours.
            </div>
            
            <div class="footer">
              © ${new Date().getFullYear()} SuperLytics. All rights reserved.<br><br>
              If you have questions, reply to this email or contact our support team.
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Welcome to ${this.appName}!

Hi ${username},

Thank you for signing up! To get started with your analytics dashboard, please verify your email address by visiting this link:

${verificationUrl}

This verification link will expire in 24 hours.

Once you verify your email, you'll be able to:
- Set up your first website for tracking
- Access your analytics dashboard
- Configure privacy-focused analytics

© ${new Date().getFullYear()} ${this.appName}
    `;

    return this.sendEmail({
      to: email,
      subject: `Verify your ${this.appName} email address`,
      html,
      text,
    });
  }

  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    const dashboardUrl = `${this.appUrl}/dashboard`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to SuperLytics - You're all set!</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              line-height: 1.6; 
              color: #333;
              margin: 0;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: #ffffff; 
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .logo { 
              font-size: 32px; 
              font-weight: bold; 
              color: #333; 
              margin-bottom: 40px;
              text-align: center;
            }
            .greeting {
              font-size: 18px;
              color: #333;
              margin-bottom: 20px;
            }
            .message { 
              font-size: 16px; 
              color: #333; 
              margin-bottom: 40px; 
              line-height: 1.6;
            }
            .cta-button { 
              display: inline-block; 
              background: #28a745;
              color: #ffffff; 
              text-decoration: none; 
              padding: 15px 30px; 
              border-radius: 6px; 
              font-weight: 500; 
              font-size: 16px;
              margin: 20px 0;
            }
            .footer { 
              font-size: 14px;
              color: #666; 
              margin-top: 40px; 
              padding-top: 20px;
              border-top: 1px solid #eee;
              text-align: center;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">SuperLytics</div>
            
            <div class="greeting">Hi ${username},</div>
            
            <div class="message">
              Your email has been verified successfully! Welcome to SuperLytics.
            </div>
            
            <div style="text-align: center;">
              <a href="${dashboardUrl}" class="cta-button">Go to Dashboard</a>
            </div>
            
            <div class="footer">
              © ${new Date().getFullYear()} SuperLytics. All rights reserved.<br><br>
              Happy analyzing! 📊
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Welcome to ${this.appName}!

Hi ${username},

Your email has been verified successfully! Welcome to the privacy-focused analytics platform.

Get Started:
1. Add your first website - Set up tracking for your site
2. Install the tracking script - Get detailed instructions in your dashboard
3. Explore your analytics - View visitor data, page views, and more
4. Configure privacy settings - Customize data collection preferences

Visit your dashboard: ${dashboardUrl}

Need help? Check out our documentation or reach out to our support team.

© ${new Date().getFullYear()} ${this.appName}
Happy analyzing! 📊
    `;

    return this.sendEmail({
      to: email,
      subject: `🎉 Welcome to ${this.appName} - You're all set!`,
      html,
      text,
    });
  }
}

export const emailService = new EmailService();
