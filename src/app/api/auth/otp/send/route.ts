import { NextResponse } from 'next/server';
import { createAndSaveOtp, maskEmail } from '@/lib/data/otp-store';
import { sendOtpEmail } from '@/lib/utils/mailer';
import { resolveUserForAuth } from '@/lib/data/user-resolver';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return NextResponse.json({ error: 'Please enter your registered Email, USN, or Employee ID.' }, { status: 400 });
    }

    const clean = identifier.trim();
    const resolved = await resolveUserForAuth(clean);

    if (!resolved || !resolved.user) {
      return NextResponse.json({
        error: 'No account found matching this identifier. Please check your Email, USN, or Employee ID, or Sign Up for a new account.'
      }, { status: 404 });
    }

    const targetEmail = resolved.targetEmail || 
      (clean.includes('@') ? clean.toLowerCase() : resolved.user.email?.toLowerCase());

    if (!targetEmail || !targetEmail.includes('@')) {
      return NextResponse.json({
        error: 'No valid email address is linked to this account. Please sign up or contact the administrator.'
      }, { status: 400 });
    }

    // Generate single 10-minute OTP and register across all user aliases
    const aliases = [
      clean,
      targetEmail,
      resolved.user.usn,
      resolved.user.email,
      resolved.user.id,
      resolved.user.staffCode
    ].filter(Boolean) as string[];

    const otp = await createAndSaveOtp(clean, targetEmail, aliases);

    // Send the verification code directly to user's registered email inbox
    const mailResult = await sendOtpEmail({
      to: targetEmail,
      otp,
      userName: resolved.user.name || clean,
    });

    if (!mailResult.success) {
      console.warn('[OTP] Mail dispatch failed:', mailResult.error);
      return NextResponse.json({
        error: `Could not send verification email to ${maskEmail(targetEmail)}: ${mailResult.error || 'Email service is unavailable.'}. Please check the email address or try again shortly.`
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      identifier: clean,
      email: targetEmail,
      maskedEmail: maskEmail(targetEmail),
      message: `A 6-digit verification code has been sent directly to your registered email (${maskEmail(targetEmail)}). It is valid for 5 minutes. Please check your inbox and spam folder.`
    });
  } catch (err: any) {
    console.error('[OTP] Unexpected error in OTP send route:', err);
    return NextResponse.json({ error: err.message || 'Failed to send verification code.' }, { status: 500 });
  }
}
