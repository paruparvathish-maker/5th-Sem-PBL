import nodemailer from 'nodemailer';

interface SendOtpEmailOptions {
  to: string;
  otp: string;
  userName?: string;
}

export async function sendOtpEmail({ to, otp, userName }: SendOtpEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || `"Industrial PBL Portal - DSATM" <${smtpUser || 'noreply@dsatm.edu.in'}>`;

    let transporter: any;

    if (smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    } else {
      // Fallback to local sendmail or Ethereal test transporter for robust development
      const testAccount = await nodemailer.createTestAccount().catch(() => null);
      if (testAccount) {
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      } else {
        transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: 'windows',
        });
      }
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #c7d2fe; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
    .otp-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px; display: block; }
    .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #4338ca; font-family: monospace; }
    .otp-expiry { font-size: 12px; color: #94a3b8; margin-top: 8px; display: block; }
    .warning { font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px; }
    .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Industrial PBL Portal</h1>
      <p>Dayananda Sagar Academy of Technology &amp; Management (DSATM)</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${userName || 'User'},</div>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #475569;">
        We received a request to verify your account or reset your password on the <strong>Industrial PBL Portal</strong>.
      </p>

      <div class="otp-box">
        <span class="otp-label">Your 6-Digit Verification Code</span>
        <div class="otp-code">${otp}</div>
        <span class="otp-expiry">Valid for 10 minutes</span>
      </div>

      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #475569;">
        Enter this code on the password reset screen to confirm your identity and create your new password.
      </p>

      <div class="warning">
        <strong>Security Notice:</strong> Never share this verification code with anyone. If you did not initiate this request, please ignore this email or notify the system administrator.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Industrial PBL Management System &bull; DSATM Bangalore
    </div>
  </div>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: smtpFrom,
      to,
      subject: `[Industrial PBL DSATM] Your Verification Code: ${otp}`,
      text: `Your Industrial PBL verification code is: ${otp}. It is valid for 10 minutes.`,
      html: htmlContent,
    });

    console.log(`[Mailer] OTP email dispatched to ${to} (MessageId: ${info.messageId})`);
    return { success: true };
  } catch (err: any) {
    console.error('[Mailer] Failed to send OTP email:', err);
    return { success: false, error: err.message };
  }
}
