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

  async sendDataExportReady(
    email: string,
    username: string,
    downloadLinks: Array<{ filename: string; url: string; size: string }>,
  ): Promise<boolean> {
    const expiryHours = 24;
    const linksList = downloadLinks
      .map(
        link => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
              <strong>${link.filename}</strong>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
              ${link.size}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
              <a href="${link.url}" 
                 style="background: #007bff; color: white; padding: 8px 16px; 
                        text-decoration: none; border-radius: 4px; font-size: 14px;">
                Download
              </a>
            </td>
          </tr>
        `,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Data Export is Ready - SuperLytics</title>
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
              margin-bottom: 30px; 
              line-height: 1.6;
            }
            .files-table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
              border: 1px solid #dee2e6;
              border-radius: 6px;
              overflow: hidden;
            }
            .files-table th {
              background: #f8f9fa;
              padding: 15px 12px;
              font-weight: 600;
              text-align: left;
              border-bottom: 2px solid #dee2e6;
            }
            .files-table td {
              padding: 12px;
              border-bottom: 1px solid #eee;
            }
            .files-table tr:last-child td {
              border-bottom: none;
            }
            .export-info {
              background: #e3f2fd;
              border: 1px solid #bbdefb;
              padding: 20px;
              border-radius: 6px;
              margin: 30px 0;
            }
            .export-info-title {
              font-size: 16px;
              font-weight: 600;
              color: #1565c0;
              margin-bottom: 15px;
            }
            .export-info-content {
              font-size: 14px;
              color: #1565c0;
              margin-bottom: 10px;
            }
            .export-info ul {
              margin: 0;
              padding-left: 20px;
            }
            .export-info li {
              color: #1565c0;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .security-note { 
              font-size: 14px;
              color: #666; 
              margin-top: 30px;
              line-height: 1.5;
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 15px;
              border-radius: 4px;
            }
            .security-note strong {
              color: #856404;
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
              Great news! Your data export has been processed and is ready for download. 
              Your analytics data has been compiled into the following files:
            </div>
            
            <table class="files-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th style="text-align: center;">Size</th>
                  <th style="text-align: center;">Download</th>
                </tr>
              </thead>
              <tbody>
                ${linksList}
              </tbody>
            </table>
            
            <div class="export-info">
              <div class="export-info-title">📊 What's included:</div>
              <div class="export-info-content">Your export contains all your analytics data in CSV format:</div>
              <ul>
                <li><strong>Website Events:</strong> Page views, clicks, and custom events</li>
                <li><strong>Session Data:</strong> Visitor sessions with device and location info</li>
                <li><strong>Website Settings:</strong> Your tracked websites and configurations</li>
                <li><strong>Reports:</strong> Any saved reports and their configurations</li>
              </ul>
            </div>
            
            <div class="security-note">
              <strong>⏰ Important:</strong> These download links will expire in ${expiryHours} hours for security reasons.<br><br>
              <strong>🔒 Privacy:</strong> Your data files are securely stored and will be automatically deleted after ${expiryHours} hours.
            </div>
            
            <div class="footer">
              © ${new Date().getFullYear()} SuperLytics. All rights reserved.<br><br>
              Need help with your export? Reply to this email and we'll assist you.
            </div>
          </div>
        </body>
      </html>
    `;

    const textLinks = downloadLinks
      .map(link => `${link.filename} (${link.size}): ${link.url}`)
      .join('\n');

    const text = `
Your Data Export is Ready

Hi ${username},

Great news! Your data export from ${this.appName} has been processed and is ready for download.

Download Links:
${textLinks}

What's included:
- Website Events: Page views, clicks, and custom events
- Session Data: Visitor sessions with device and location info  
- Website Settings: Your tracked websites and configurations
- Reports: Any saved reports and their configurations

IMPORTANT: These download links will expire in ${expiryHours} hours for security reasons.

© ${new Date().getFullYear()} ${this.appName}
    `;

    return this.sendEmail({
      to: email,
      subject: `📊 Your ${this.appName} data export is ready`,
      html,
      text,
    });
  }

  async sendDataExportFailed(email: string, username: string, error?: string): Promise<boolean> {
    const supportEmail = this.fromAddress.replace('noreply@', 'support@');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Data Export Failed - SuperLytics</title>
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
              margin-bottom: 30px; 
              line-height: 1.6;
            }
            .error-box {
              background: #f8d7da;
              border: 1px solid #f5c6cb;
              padding: 20px;
              border-radius: 6px;
              margin: 30px 0;
            }
            .error-title {
              font-size: 16px;
              font-weight: 600;
              color: #721c24;
              margin-bottom: 15px;
            }
            .error-content {
              font-size: 14px;
              color: #721c24;
            }
            .cta-button { 
              display: inline-block; 
              background: #007bff;
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
              We encountered an issue while processing your data export request. 
              We apologize for the inconvenience.
            </div>
            
            <div class="error-box">
              <div class="error-title">❌ Export Failed</div>
              <div class="error-content">
                Unfortunately, we couldn't complete your data export due to a technical issue.
                ${error ? ` Error details: ${error}` : ''}
              </div>
            </div>
            
            <div class="message">
              Our team has been notified and will investigate this issue. 
              You can try requesting your export again, or contact our support team for assistance.
            </div>
            
            <div style="text-align: center;">
              <a href="${this.appUrl}/profile/data" class="cta-button">Try Export Again</a>
            </div>
            
            <div class="footer">
              © ${new Date().getFullYear()} SuperLytics. All rights reserved.<br><br>
              Need help? Contact us at ${supportEmail}
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Data Export Failed

Hi ${username},

We encountered an issue while processing your data export request from ${this.appName}. We apologize for the inconvenience.

${error ? `Error details: ${error}` : ''}

Our team has been notified and will investigate this issue. You can try requesting your export again at: ${this.appUrl}/profile/data

Need help? Contact us at ${supportEmail}

© ${new Date().getFullYear()} ${this.appName}  
    `;

    return this.sendEmail({
      to: email,
      subject: `❌ ${this.appName} data export failed`,
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
