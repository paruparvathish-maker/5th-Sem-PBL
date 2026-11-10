import { NextResponse } from 'next/server';
import { createAndSaveActivationToken } from '@/lib/data/otp-store';
import { sendActivationEmail, getAppOrigin } from '@/lib/utils/mailer';
import { resolveUserForAuth, persistProfileToDisk } from '@/lib/data/user-resolver';
import { saveCloudCredentials } from '@/lib/data/cloud-sync';

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
        error: 'No account found matching this identifier. Please verify your details or sign up for a new account.' 
      }, { status: 404 });
    }

    if (resolved.isActivated) {
      return NextResponse.json({ 
        message: 'This account is already activated! Please log in with your email and password.' 
      }, { status: 200 });
    }

    const targetEmail = resolved.targetEmail || 
      (clean.includes('@') ? clean.toLowerCase() : resolved.user.email?.toLowerCase());

    if (!targetEmail || !targetEmail.includes('@')) {
      return NextResponse.json({ 
        error: 'No registered email is associated with this account. Please sign up to link your email.' 
      }, { status: 400 });
    }

    const origin = getAppOrigin(request);
    const token = await createAndSaveActivationToken(targetEmail);
    const activationLink = `${origin}/activate?token=${token}&email=${encodeURIComponent(targetEmail)}`;

    resolved.user.activationToken = token;
    persistProfileToDisk(resolved.user);

    await saveCloudCredentials(resolved.user.id, {
      activationToken: token,
      isActivated: false,
      email: targetEmail
    }, [resolved.user.usn || '', targetEmail]);

    const mailResult = await sendActivationEmail({
      to: targetEmail,
      userName: resolved.user.name || clean,
      activationLink
    });

    if (!mailResult.success) {
      return NextResponse.json({
        error: `Could not deliver activation email to ${targetEmail}: ${mailResult.error || 'Email service error'}. Please verify your email or try again.`
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      message: `A fresh activation link has been sent to your registered email (${targetEmail}). Please check your inbox and spam folder.`
    });
  } catch (err: any) {
    console.error('[ResendActivation] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Failed to resend activation email.' }, { status: 500 });
  }
}
