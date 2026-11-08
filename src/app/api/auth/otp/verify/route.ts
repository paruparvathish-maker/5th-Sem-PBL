import { NextResponse } from 'next/server';
import { verifyOtpCode } from '@/lib/data/otp-store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { identifier, otp } = await request.json();
    if (!identifier || !otp) {
      return NextResponse.json({ error: 'Identifier and 6-digit verification code are required.' }, { status: 400 });
    }

    const result = await verifyOtpCode(String(identifier), String(otp));

    if (!result.valid) {
      return NextResponse.json({ error: result.error || 'Invalid verification code.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code confirmed successfully. Please create your new password.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'OTP verification failed.' }, { status: 500 });
  }
}

