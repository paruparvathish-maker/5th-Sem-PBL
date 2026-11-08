import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { isOtpVerified, clearOtp } from '@/lib/data/otp-store';
import { saveCloudCredentials } from '@/lib/data/cloud-sync';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { identifier, newPassword, confirmPassword } = await request.json();

    if (!identifier || !newPassword) {
      return NextResponse.json({ error: 'Identifier and new password are required.' }, { status: 400 });
    }

    const cleanPass = String(newPassword).trim();
    if (cleanPass.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    if (confirmPassword && cleanPass !== String(confirmPassword).trim()) {
      return NextResponse.json({ error: 'Passwords do not match. Please re-enter carefully.' }, { status: 400 });
    }

    const verified = await isOtpVerified(String(identifier));
    if (!verified) {
      return NextResponse.json({ error: 'Verification code not confirmed. Please enter and verify your OTP first.' }, { status: 403 });
    }

    const cleanId = String(identifier).trim();
    const user = store.findUserByUsernameOrEmail(cleanId);

    if (!user) {
      return NextResponse.json({ error: 'Account not found for password reset.' }, { status: 404 });
    }

    // Update profile in store
    user.password = cleanPass;
    user.isFirstLogin = false;
    user.passwordUpdatedAt = new Date().toISOString();

    const aliases = [user.id, user.usn, user.email, user.staffCode, user.phone].filter(Boolean) as string[];

    // Synchronize to Serverless Cloud KV for instant multi-device reflection
    await saveCloudCredentials(user.id, {
      password: cleanPass,
      isFirstLogin: false,
      passwordUpdatedAt: user.passwordUpdatedAt
    }, aliases);

    // Clean up OTP state
    await clearOtp(cleanId);

    // Uplink updated profile to backend database
    store.syncToSupabase().catch(console.error);

    return NextResponse.json({
      success: true,
      message: 'Password successfully updated! You can now log in using your new credentials.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to reset password.' }, { status: 500 });
  }
}

