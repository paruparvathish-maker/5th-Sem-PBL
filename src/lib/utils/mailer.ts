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
  const smtpFrom = process.env.SMTP_FROM || `"DSATM Industrial PBL" <${smtpUser}>`;

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

    // Step 1: Normalize any legacy or mistyped subdomains (teststudent, student) to official @dsatm.edu.in
    let effectiveTo = cleanTo
      .replace(/@(teststudent|student)\.dsatm\.edu\.in/gi, '@dsatm.edu.in')
      .replace(/@([a-z0-9_-]+)\.teststudent\.dsatm\.edu\.in/gi, '@dsatm.edu.in')
      .replace(/@teststudent\./gi, '@')
      .trim();

    // Step 2: Intercept unresolvable synthetic test domains to prevent Gmail bounce alerts
    if (
      effectiveTo.includes('teststudent') ||
      effectiveTo.endsWith('@example.com') ||
      effectiveTo.endsWith('@test.com') ||
      effectiveTo.endsWith('.test')
    ) {
      console.log(`[Mailer] Simulated OTP email dispatch for synthetic test address: ${effectiveTo} (Skipped SMTP network call to prevent Gmail bounce alerts)`);
      return { success: true };
    }

    const textContent = `Dayananda Sagar Academy of Technology & Management (DSATM)
Industrial Project Based Learning (PBL) Portal

Hello ${userName || 'User'},

We received a request to verify your identity or reset your password on the DSATM Industrial PBL Portal.

Your 6-Digit Verification Code is: ${otp}
(This code is strictly confidential and expires in 5 minutes)

Enter this code on the password reset screen to confirm your identity and create your new password.

Security Notice:
Never share this verification code with anyone. DSATM staff will never ask for your verification code or password. If you did not initiate this request, you can safely disregard this message.

---
Department of Computer Science & Engineering
Dayananda Sagar Academy of Technology & Management (DSATM)
Kanakapura Road, Udayapura, Bangalore, Karnataka - 560082
Portal: ${getAppOrigin()}
`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DSATM PBL Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">Industrial PBL Portal</h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #c7d2fe;">Dayananda Sagar Academy of Technology &amp; Management (DSATM)</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <p style="font-size: 16px; font-weight: 600; margin: 0 0 12px 0; color: #1e293b;">Hello ${userName || 'User'},</p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                We received a request to verify your account or reset your password on the <strong>DSATM Industrial PBL Portal</strong>.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td align="center" style="padding: 24px 16px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 8px;">Your 6-Digit Verification Code</div>
                    <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #4338ca; font-family: 'Courier New', Courier, monospace;">${otp}</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 8px;">Valid for 5 minutes</div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.5; color: #475569;">
                Enter this 6-digit code on the portal screen to verify your identity and set your new password.
              </p>

              <div style="font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 18px; margin-top: 20px;">
                <strong>Security Notice:</strong> Never share this verification code with anyone. If you did not initiate this request, you can safely ignore this email.
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.5;">
              Department of Computer Science &amp; Engineering<br>
              Dayananda Sagar Academy of Technology &amp; Management (DSATM)<br>
              Kanakapura Road, Udayapura, Bangalore, Karnataka - 560082<br>
              &copy; ${new Date().getFullYear()} DSATM PBL Portal &bull; All rights reserved
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    let lastError: any = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const transporter = createTransporter();
        const info = await transporter.sendMail({
          from: smtpFrom,
          sender: smtpUser,
          replyTo: smtpUser,
          to: effectiveTo,
          subject: `Your DSATM PBL Portal verification code: ${otp}`,
          text: textContent,
          html: htmlContent,
          headers: {
            'X-Entity-Ref-ID': `pbl-otp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            'X-Mailer': 'DSATM Industrial PBL Platform',
            'X-Priority': '3'
          }
        });

        console.log(`[Mailer] OTP email dispatched successfully to ${effectiveTo} on attempt ${attempt} (MessageId: ${info.messageId})`);
        return { success: true };
      } catch (err: any) {
        lastError = err;
        console.warn(`[Mailer] OTP dispatch attempt ${attempt} failed for ${effectiveTo}:`, err.message);
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

    // Step 1: Normalize any legacy or mistyped subdomains (teststudent, student) to official @dsatm.edu.in
    let effectiveTo = cleanTo
      .replace(/@(teststudent|student)\.dsatm\.edu\.in/gi, '@dsatm.edu.in')
      .replace(/@([a-z0-9_-]+)\.teststudent\.dsatm\.edu\.in/gi, '@dsatm.edu.in')
      .replace(/@teststudent\./gi, '@')
      .trim();

    // Step 2: Intercept unresolvable synthetic test domains to prevent Gmail bounce alerts
    if (
      effectiveTo.includes('teststudent') ||
      effectiveTo.endsWith('@example.com') ||
      effectiveTo.endsWith('@test.com') ||
      effectiveTo.endsWith('.test')
    ) {
      console.log(`[Mailer] Simulated OTP email dispatch for synthetic test address: ${effectiveTo} (Skipped SMTP network call to prevent Gmail bounce alerts)`);
      return { success: true };
    }

    const textContent = `Dayananda Sagar Academy of Technology & Management (DSATM)
Industrial Project Based Learning (PBL) Portal

Hello ${userName || 'User'},

Thank you for registering on the DSATM Industrial PBL Portal.

To complete your registration and activate your account, please click or open the link below:
${activationLink}

This link is valid for 24 hours.

Once activated, you can log in to the portal using your registered email/USN and password to submit reports, track phase deadlines, and view guide evaluations.

Security Notice:
If you did not create an account on the DSATM Industrial PBL Portal, you can safely ignore this message.

---
Department of Computer Science & Engineering
Dayananda Sagar Academy of Technology & Management (DSATM)
Kanakapura Road, Udayapura, Bangalore, Karnataka - 560082
Portal: ${getAppOrigin()}
`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Activate Your DSATM PBL Account</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">Industrial PBL Portal</h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #c7d2fe;">Dayananda Sagar Academy of Technology &amp; Management (DSATM)</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <p style="font-size: 16px; font-weight: 600; margin: 0 0 12px 0; color: #1e293b;">Hello ${userName || 'User'},</p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Thank you for registering on the <strong>DSATM Industrial PBL Portal</strong>. To complete your registration and activate your account, please click the button below:
              </p>

              <!-- Action Button Table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" bgcolor="#4338ca" style="border-radius: 12px;">
                          <a href="${activationLink}" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 14px; font-weight: 800; color: #ffffff; text-decoration: none; border-radius: 12px; letter-spacing: 0.5px; font-family: sans-serif; background-color: #4338ca;">
                            Activate My Account
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <div style="font-size: 11px; color: #4338ca; word-break: break-all; margin-bottom: 20px; background-color: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-family: 'Courier New', Courier, monospace;">
                ${activationLink}
              </div>

              <div style="font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 18px; margin-top: 20px;">
                <strong>Security Notice:</strong> This activation link is valid for 24 hours. If you did not register for an account, please ignore this email.
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.5;">
              Department of Computer Science &amp; Engineering<br>
              Dayananda Sagar Academy of Technology &amp; Management (DSATM)<br>
              Kanakapura Road, Udayapura, Bangalore, Karnataka - 560082<br>
              &copy; ${new Date().getFullYear()} DSATM PBL Portal &bull; All rights reserved
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    let lastError: any = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const transporter = createTransporter();
        const info = await transporter.sendMail({
          from: smtpFrom,
          sender: smtpUser,
          replyTo: smtpUser,
          to: effectiveTo,
          subject: `Activate your DSATM PBL account - ${userName || 'Student'}`,
          text: textContent,
          html: htmlContent,
          headers: {
            'X-Entity-Ref-ID': `pbl-act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            'X-Mailer': 'DSATM Industrial PBL Platform',
            'X-Priority': '3'
          }
        });

        console.log(`[Mailer] Activation email dispatched successfully to ${effectiveTo} on attempt ${attempt} (MessageId: ${info.messageId})`);
        return { success: true };
      } catch (err: any) {
        lastError = err;
        console.warn(`[Mailer] Activation dispatch attempt ${attempt} failed for ${effectiveTo}:`, err.message);
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
