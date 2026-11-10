import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { saveCloudCredentials, fetchCloudCredentials } from '@/lib/data/cloud-sync';
import { verifyActivationToken } from '@/lib/data/otp-store';
import { resolveUserForAuth, persistProfileToDisk } from '@/lib/data/user-resolver';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json({ error: 'Activation token and email are required.' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanToken = String(token).trim();

    // Verify token
    const tokenResult = await verifyActivationToken(cleanEmail, cleanToken);
    if (!tokenResult.valid) {
      return NextResponse.json({ error: tokenResult.error || 'Invalid or expired activation link.' }, { status: 400 });
    }

    // Find user profile
    const resolved = await resolveUserForAuth(cleanEmail);
    const user = resolved?.user;

    if (user) {
      user.isActivated = true;
      user.isFirstLogin = false;
      user.activationToken = undefined;

      persistProfileToDisk(user);

      const aliases = [user.id, user.email, user.usn, user.staffCode, cleanEmail].filter(Boolean) as string[];
      await saveCloudCredentials(user.id, {
        password: user.password || '',
        isFirstLogin: false,
        isActivated: true,
        email: cleanEmail,
        name: user.name,
        usn: user.usn,
        role: user.role,
        passwordUpdatedAt: user.passwordUpdatedAt || new Date().toISOString()
      }, aliases);

      store.syncToSupabase().catch(console.error);
    } else {
      // Save activation state directly to Cloud KV by email
      await saveCloudCredentials(cleanEmail, {
        isActivated: true,
        isFirstLogin: false,
        email: cleanEmail,
        passwordUpdatedAt: new Date().toISOString()
      }, [cleanEmail]);
    }

    return NextResponse.json({
      success: true,
      message: 'Your account has been successfully activated! You can now log in using your college email and password.'
    });
  } catch (err: any) {
    console.error('[Activate] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Account activation failed.' }, { status: 500 });
  }
}
