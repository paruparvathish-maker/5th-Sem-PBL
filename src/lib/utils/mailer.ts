import nodemailer from 'nodemailer';

export function getAppOrigin(request?: Request): string {
  if (request) {
    const originHeader = request.headers.get('origin');
    if (originHeader && originHeader.startsWith('http')) {
      return originHeader;
    }
    const fwdHost = request.headers.get('x-forwarded-host');
    const fwdProto = request.headers.get('x-forwarded-proto') || 'https';
    if (fwdHost) {
      return `${fwdProto}://${fwdHost}`;
    }
    const host = request.headers.get('host');
    if (host) {
      const proto = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
      return `${proto}://${host}`;
    }
    try {
      const u = new URL(request.url);
      if (u.origin && !u.origin.includes('0.0.0.0')) return u.origin;
    } catch {}
  }
  return process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://5th-sem-pbl.vercel.app');
}

function getSmtpConfig() {
  const smtpUser = (process.env.SMTP_USER || process.env.GMAIL_USER || 'paruparvathish@gmail.com').trim();
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || 'mxwlmeaxzdakxlhk';
  const smtpPass = rawPass.replace(/\s+/g, '');
  const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpFrom = process.env.SMTP_FROM || `"Industrial PBL Portal - DSATM" <${smtpUser}>`;

  return { smtpUser, smtpPass, smtpHost, smtpPort, smtpFrom };
}

function createTransporter() {
  const { smtpUser, smtpPass, smtpHost, smtpPort } = getSmtpConfig();

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

interface SendOtpEmailOptions {
  to: string;
  otp: string;
  userName?: string;
}

export async function sendOtpEmail({ to, otp, userName }: SendOtpEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const { smtpUser, smtpPass, smtpFrom } = getSmtpConfig();

    if (!smtpUser || !smtpPass) {
      const errMsg = 'SMTP credentials not configured. Please configure SMTP_USER and SMTP_PASS (Google App Password) in environment variables.';
      console.warn(`[Mailer] ${errMsg}`);
      return { success: false, error: errMsg };
    }

    const cleanTo = (to || '').trim().toLowerCase();
    if (!cleanTo || !cleanTo.includes('@')) {
      return { success: false, error: `Invalid recipient email address: "${to}"` };
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
        <span class="otp-expiry">Valid for 5 minutes</span>
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

    let lastError: any = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const transporter = createTransporter();
        const info = await transporter.sendMail({
          from: smtpFrom,
          to: cleanTo,
          subject: `[Industrial PBL DSATM] Your Verification Code: ${otp}`,
          text: `Your Industrial PBL verification code is: ${otp}. It is valid for 5 minutes. Enter this code to verify your account.`,
          html: htmlContent,
        });

        console.log(`[Mailer] OTP email dispatched successfully to ${cleanTo} on attempt ${attempt} (MessageId: ${info.messageId})`);
        return { success: true };
      } catch (err: any) {
        lastError = err;
        console.warn(`[Mailer] OTP dispatch attempt ${attempt} failed for ${cleanTo}:`, err.message);
        if (attempt === 1) {
          await new Promise(r => setTimeout(r, 600));
        }
      }
    }

    return { success: false, error: lastError?.message || 'Failed to dispatch verification email.' };
  } catch (err: any) {
    console.error('[Mailer] Unexpected OTP dispatch error:', err);
    return { success: false, error: err.message };
  }
}

interface SendActivationEmailOptions {
  to: string;
  userName?: string;
  activationLink: string;
}

export async function sendActivationEmail({ to, userName, activationLink }: SendActivationEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const { smtpUser, smtpPass, smtpFrom } = getSmtpConfig();

    if (!smtpUser || !smtpPass) {
      const errMsg = 'SMTP credentials not configured. Please configure SMTP_USER and SMTP_PASS (Google App Password) in environment variables.';
      console.warn(`[Mailer] ${errMsg}`);
      return { success: false, error: errMsg };
    }

    const cleanTo = (to || '').trim().toLowerCase();
    if (!cleanTo || !cleanTo.includes('@')) {
      return { success: false, error: `Invalid recipient email address: "${to}"` };
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
    .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #1e293b; }
    .btn-box { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: #4338ca; color: #ffffff !important; padding: 14px 32px; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(67, 56, 202, 0.4); }
    .alt-link { font-size: 11px; color: #64748b; word-break: break-all; margin-top: 16px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .warning { font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 24px; }
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
        Thank you for registering on the <strong>Industrial PBL Portal</strong>. To complete your registration and activate your account, please click the button below:
      </p>

      <div class="btn-box">
        <a href="${activationLink}" class="btn" target="_blank" style="color: #ffffff !important;">Activate My Account</a>
      </div>

      <p style="margin: 0; font-size: 12px; color: #64748b;">
        If the button does not work, you can copy and paste the following link into your browser:
      </p>
      <div class="alt-link">
        ${activationLink}
      </div>

      <div class="warning">
        <strong>Security Notice:</strong> This activation link is valid for 24 hours. If you did not create an account on the Industrial PBL Portal, you can safely ignore this email.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Industrial PBL Management System &bull; DSATM Bangalore
    </div>
  </div>
</body>
</html>
    `;

    let lastError: any = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const transporter = createTransporter();
        const info = await transporter.sendMail({
          from: smtpFrom,
          to: cleanTo,
          subject: `[Industrial PBL DSATM] Activate Your Account`,
          text: `Hello ${userName || 'User'},\n\nPlease activate your Industrial PBL account by visiting this link:\n${activationLink}\n\nThis link is valid for 24 hours.`,
          html: htmlContent,
        });

        console.log(`[Mailer] Activation email dispatched successfully to ${cleanTo} on attempt ${attempt} (MessageId: ${info.messageId})`);
        return { success: true };
      } catch (err: any) {
        lastError = err;
        console.warn(`[Mailer] Activation dispatch attempt ${attempt} failed for ${cleanTo}:`, err.message);
        if (attempt === 1) {
          await new Promise(r => setTimeout(r, 600));
        }
      }
    }

    return { success: false, error: lastError?.message || 'Failed to dispatch activation email.' };
  } catch (err: any) {
    console.error('[Mailer] Unexpected activation dispatch error:', err);
    return { success: false, error: err.message };
  }
}
