import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { createAndSaveOtp, maskEmail } from '@/lib/data/otp-store';
import { sendOtpEmail } from '@/lib/utils/mailer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return NextResponse.json({ error: 'Please enter your registered Email, USN, or Employee ID.' }, { status: 400 });
    }

    const clean = identifier.trim();
    const user = store.findUserByUsernameOrEmail(clean);

    if (!user) {
      return NextResponse.json({
        error: 'No account found matching this identifier. Please check your Email, USN, or Employee ID, or Sign Up for a new account.'
      }, { status: 404 });
    }

    const targetEmail = user.email || (clean.includes('@') ? clean : `${clean.toLowerCase()}@student.dsatm.edu.in`);
    const otp = await createAndSaveOtp(clean, targetEmail);

    // Send the verification code directly to user's email inbox
    const mailResult = await sendOtpEmail({
      to: targetEmail,
      otp,
      userName: user.name || clean,
    });

    if (!mailResult.success) {
      console.warn('[OTP] Mail dispatch failed:', mailResult.error);
      return NextResponse.json({
        error: `Could not send verification email to ${maskEmail(targetEmail)}: ${mailResult.error || 'Email service is unavailable.'}`
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      identifier: clean,
      email: targetEmail,
      maskedEmail: maskEmail(targetEmail),
      message: `A 6-digit verification code has been sent directly to your registered email (${maskEmail(targetEmail)}). Please check your inbox and spam folder.`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to send verification code.' }, { status: 500 });
  }
}

