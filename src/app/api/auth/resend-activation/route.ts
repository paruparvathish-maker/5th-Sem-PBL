import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { createAndSaveActivationToken } from '@/lib/data/otp-store';
import { sendActivationEmail } from '@/lib/utils/mailer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();
    if (!identifier) {
      return NextResponse.json({ error: 'Please enter your registered Email, USN, or Employee ID.' }, { status: 400 });
    }

    const clean = String(identifier).trim().toLowerCase();
    const user = store.findUserByUsernameOrEmail(clean);

    if (!user) {
      return NextResponse.json({ error: 'No account found matching this identifier. Please sign up for an account.' }, { status: 404 });
    }

    if (user.isActivated) {
      return NextResponse.json({ message: 'This account is already activated! Please log in with your password.' }, { status: 200 });
    }

    const targetEmail = user.email || (clean.includes('@') ? clean : `${clean}@student.dsatm.edu.in`);
    const url = new URL(request.url);
    const origin = url.origin || 'https://5th-sem-pbl.vercel.app';

    const token = await createAndSaveActivationToken(targetEmail);
    const activationLink = `${origin}/activate?token=${token}&email=${encodeURIComponent(targetEmail)}`;

    await sendActivationEmail({
      to: targetEmail,
      userName: user.name || clean,
      activationLink
    });

    return NextResponse.json({
      success: true,
      message: `A fresh activation link has been sent to your email (${targetEmail}). Please check your inbox and spam folder.`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to resend activation email.' }, { status: 500 });
  }
}

