import { NextResponse } from 'next/server';
import { isOtpVerified, clearOtp } from '@/lib/data/otp-store';
import { saveCloudCredentials } from '@/lib/data/cloud-sync';
import { resolveUserForAuth, persistProfileToDisk } from '@/lib/data/user-resolver';
import { store } from '@/lib/data/store';

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

    const cleanId = String(identifier).trim();
    const verified = await isOtpVerified(cleanId);
    if (!verified) {
      return NextResponse.json({ error: 'Verification code not confirmed or expired. Please enter and verify your OTP first.' }, { status: 403 });
    }

    const resolved = await resolveUserForAuth(cleanId);

    if (!resolved || !resolved.user) {
      return NextResponse.json({ error: 'Account not found for password reset.' }, { status: 404 });
    }

    const user = resolved.user;
    user.password = cleanPass;
    user.isFirstLogin = false;
    user.passwordUpdatedAt = new Date().toISOString();

    // Persist to disk (server-side persistence)
    persistProfileToDisk(user);

    const aliases = [user.id, user.usn, user.email, user.staffCode, user.phone, cleanId].filter(Boolean) as string[];

    // Synchronize to Serverless Cloud KV for instant multi-device reflection
    await saveCloudCredentials(user.id, {
      password: cleanPass,
      isFirstLogin: false,
      passwordUpdatedAt: user.passwordUpdatedAt,
      email: user.email,
      name: user.name,
      usn: user.usn,
      role: user.role
    }, aliases);

    // Clean up OTP state
    await clearOtp(cleanId);
    if (user.usn && user.usn !== cleanId) await clearOtp(user.usn);
    if (user.email && user.email !== cleanId) await clearOtp(user.email);

    // Uplink updated profile to backend database
    store.syncToSupabase().catch(console.error);

    return NextResponse.json({
      success: true,
      message: 'Password successfully updated! You can now log in using your new credentials.'
    });
  } catch (err: any) {
    console.error('[ResetPassword] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Failed to reset password.' }, { status: 500 });
  }
}
