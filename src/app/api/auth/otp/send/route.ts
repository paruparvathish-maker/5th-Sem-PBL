import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { createAndSaveOtp, maskEmail } from '@/lib/data/otp-store';

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

    return NextResponse.json({
      success: true,
      identifier: clean,
      email: targetEmail,
      maskedEmail: maskEmail(targetEmail),
      otp, // Provided in response for simulated university demo verification
      message: `A 6-digit verification code has been generated and sent to ${maskEmail(targetEmail)}.`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to send verification code.' }, { status: 500 });
  }
}

