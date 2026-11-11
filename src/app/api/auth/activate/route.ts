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
      // Graceful fallback: If already activated (e.g. email scanner pre-fetch or double click)
      const existing = await resolveUserForAuth(cleanEmail);
      if (existing?.isActivated) {
        return NextResponse.json({
          success: true,
          message: 'Your account is already activated! You can now log in using your college email and password.'
        });
      }
      return NextResponse.json({ error: tokenResult.error || 'Invalid or expired activation link.' }, { status: 400 });
    }

    // Find user profile
    const resolved = await resolveUserForAuth(cleanEmail);
    let user = resolved?.user;

    // Check store directly if not resolved
    if (!user) {
      const allStore = store.getAllProfiles();
      user = allStore.find(p => 
        (p.email && p.email.toLowerCase() === cleanEmail) ||
        (cleanEmail.startsWith('1dt') && p.usn && p.usn.toLowerCase() === cleanEmail.split('@')[0])
      );
    }

    if (user) {
      user.isActivated = true;
      user.isFirstLogin = false;
      user.activationToken = undefined;
      user.email = cleanEmail;

      // 1. Synchronize in-memory store immediately
      const allStore = store.getAllProfiles();
      for (const p of allStore) {
        if (
          p.id === user.id ||
          (user.usn && p.usn && p.usn.toUpperCase() === user.usn.toUpperCase()) ||
          (p.email && p.email.toLowerCase() === cleanEmail)
        ) {
          p.isActivated = true;
          p.isFirstLogin = false;
          p.activationToken = undefined;
          p.email = cleanEmail;
          if (user.password) p.password = user.password;
        }
      }
      store.save(true);

      // 2. Persist to disk (backend/data.json and /tmp)
      persistProfileToDisk(user);

      // 3. Persist to Cloud KV across all identifier aliases
      const aliases = [
        user.id,
        user.id.toLowerCase(),
        user.email,
        cleanEmail,
        user.usn,
        user.usn?.toUpperCase(),
        user.usn?.toLowerCase(),
        user.staffCode,
        cleanEmail.split('@')[0]
      ].filter(Boolean) as string[];

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
