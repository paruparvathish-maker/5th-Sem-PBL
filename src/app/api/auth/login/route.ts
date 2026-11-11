import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { fetchCloudCredentials } from '@/lib/data/cloud-sync';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const BACKEND_DATA_PATH = path.join(process.cwd(), 'backend', 'data.json');
const TMP_DATA_PATH = '/tmp/pbl_backend_data.json';

function verifyPassword(user: any, inputPass: string): boolean {
  if (!user) return false;
  const cleanInput = inputPass.trim();

  // 1. Password verified if user has created/updated their password
  if (user.password && user.password === cleanInput) {
    return true;
  }

  // 2. Main System Administrator
  if (user.id === '180881' || user.email?.toLowerCase() === 'paruparvathish@gmail.com') {
    return cleanInput === '03May@2002@';
  }

  // 3. Official Leadership & Industry Admin Accounts
  if (user.role === 'admin') {
    if (user.id === 'admin-hod' || user.email?.toLowerCase() === 'hod.cse@dsatm.edu.in') {
      return cleanInput === 'HOD@CSE#2026' || cleanInput === (user.password || '');
    }
    if (user.id === 'admin-principal' || user.email?.toLowerCase() === 'principal@dsatm.edu.in') {
      return cleanInput === 'DSATM@PRIN#984' || cleanInput === (user.password || '');
    }
    if (user.id?.startsWith('industry-') && user.password) {
      return cleanInput === user.password;
    }
    return cleanInput === (user.password || '');
  }

  // 4. For regular Students and Faculty: Default credentials have been removed!
  // They MUST have created their password during Sign Up or Password Reset.
  return false;
}

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();
    if (!identifier) {
      return NextResponse.json({ error: 'Identifier is required' }, { status: 400 });
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const cleanDigits = cleanId.replace(/\D/g, '');
    const cleanAlpha = cleanId.replace(/[^a-z0-9]/g, '');
    const cleanEmailPrefix = cleanId.includes('@') ? cleanId.split('@')[0].replace(/[^a-z0-9]/g, '') : cleanAlpha;
    const cleanPass = password !== undefined ? String(password).trim() : '';

    // 1. Read profiles from disk (preferring backend/data.json) and merge with in-memory store
    let diskProfiles: any[] = [];
    if (fs.existsSync(BACKEND_DATA_PATH)) {
      try {
        const raw = fs.readFileSync(BACKEND_DATA_PATH, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.profiles)) {
          diskProfiles = data.profiles;
        }
      } catch {}
    }
    if (fs.existsSync(TMP_DATA_PATH) && TMP_DATA_PATH !== BACKEND_DATA_PATH) {
      try {
        const raw = fs.readFileSync(TMP_DATA_PATH, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.profiles)) {
          const dMap = new Map(diskProfiles.map(p => [p.id, p]));
          data.profiles.forEach((p: any) => {
            if (dMap.has(p.id)) {
              dMap.set(p.id, { ...dMap.get(p.id), ...p });
            } else {
              dMap.set(p.id, p);
            }
          });
          diskProfiles = Array.from(dMap.values());
        }
      } catch {}
    }

    // Merge in-memory store and disk profiles:
    // Base is storeProfiles; diskProfiles represent persisted user states (passwords, activations, registered emails)
    const storeProfiles = store.getAllProfiles();
    const profileMap = new Map<string, any>(storeProfiles.map(p => [p.id, { ...p }]));
    
    diskProfiles.forEach(dp => {
      if (!profileMap.has(dp.id)) {
        profileMap.set(dp.id, dp);
      } else {
        const base = profileMap.get(dp.id);
        profileMap.set(dp.id, {
          ...base,
          ...dp,
          // Guarantee that once activated on disk or in memory, it stays activated!
          isActivated: (dp.isActivated === true || base.isActivated === true) ? true : (dp.isActivated ?? base.isActivated),
          password: dp.password || base.password,
          email: (dp.email && !dp.email.endsWith('@student.dsatm.edu.in')) ? dp.email : base.email,
          isFirstLogin: dp.isFirstLogin !== undefined ? dp.isFirstLogin : base.isFirstLogin,
        });
      }
    });
    let profiles = Array.from(profileMap.values());

    // 2. Fetch and merge cloud credentials (ensures passwords changed on laptops are instantly available to phones)
    try {
      const cloudCreds = await fetchCloudCredentials();
      if (cloudCreds && typeof cloudCreds === 'object' && Object.keys(cloudCreds).length > 0) {
        profiles.forEach((p: any) => {
          const uLower = (p.id || '').toLowerCase();
          const usnLower = (p.usn || '').toLowerCase();
          const usnUpper = (p.usn || '').toUpperCase();
          const emailLower = (p.email || '').toLowerCase();
          const phoneClean = p.phone || '';

          const record = cloudCreds[p.id] ||
            cloudCreds[uLower] ||
            (usnLower && cloudCreds[usnLower]) ||
            (usnUpper && cloudCreds[usnUpper]) ||
            (emailLower && cloudCreds[emailLower]) ||
            (phoneClean && cloudCreds[phoneClean]);

          if (record) {
            if (record.password) p.password = record.password;
            p.isFirstLogin = record.isFirstLogin ?? false;
            if (record.isActivated === true || p.isActivated === true) {
              p.isActivated = true;
            } else if (record.isActivated !== undefined) {
              p.isActivated = record.isActivated;
            }
            if (record.email && !record.email.endsWith('@student.dsatm.edu.in')) {
              p.email = record.email;
            }
            p.passwordUpdatedAt = record.passwordUpdatedAt || record.updatedAt || p.passwordUpdatedAt;
          }
        });
      }
    } catch (e) {
      console.warn('Cloud creds merge in login route non-blocking warning:', e);
    }

    // 3. Smart Identifier Matching
    // Step 3a: Direct matching (email, email prefix, USN, ID, staff code, phone, industry ID)
    let user = profiles.find((p: any) => {
      const email = p.email?.toLowerCase();
      const usn = p.usn?.toLowerCase();
      const id = p.id?.toLowerCase();
      const phone = p.phone?.toLowerCase();
      const phoneDigits = p.phone ? p.phone.replace(/\D/g, '') : '';
      const staffCode = p.staffCode?.toLowerCase();
      const emailPrefix = email ? email.split('@')[0] : '';

      const cleanIdPrefix = cleanId.includes('@') ? cleanId.split('@')[0] : '';

      return (
        email === cleanId ||
        emailPrefix === cleanId ||
        (cleanIdPrefix && usn === cleanIdPrefix) ||
        (cleanId.endsWith('@dsatm.edu.in') && usn === cleanIdPrefix) ||
        usn === cleanId ||
        id === cleanId ||
        staffCode === cleanId ||
        phone === cleanId ||
        (cleanDigits.length >= 7 && phoneDigits === cleanDigits) ||
        (p.id?.startsWith('industry-') && (id === `industry-${cleanId}` || id === cleanId))
      );
    });

    // Step 3b: Special administrative & leadership aliases
    if (!user) {
      if (
        cleanId.includes('parvathish') ||
        cleanId.includes('pudugosula') ||
        ['admin', 'administrator', 'mainadmin', 'main admin', 'paru', '180881'].includes(cleanId) ||
        cleanId === 'paruparvathish@gmail.com' ||
        cleanId === 'parvathisha-cse@dsatm.edu.in'
      ) {
        user = profiles.find((p: any) => p.id === '180881' || p.email === 'paruparvathish@gmail.com');
      } else if (
        cleanId.includes('nandini') ||
        ['hod', 'hodcse', 'hod_cse', 'hod cse'].includes(cleanId) ||
        cleanId === 'hod.cse@dsatm.edu.in' ||
        cleanId === 'vp@dsatm.edu.in'
      ) {
        user = profiles.find((p: any) => p.id === 'admin-hod' || p.email === 'hod.cse@dsatm.edu.in');
      } else if (
        cleanId.includes('ravishankar') ||
        cleanId.includes('principal') ||
        ['prin', 'principal office', 'principaldsatm'].includes(cleanId) ||
        cleanId === 'principal@dsatm.edu.in'
      ) {
        user = profiles.find((p: any) => p.id === 'admin-principal' || p.email === 'principal@dsatm.edu.in');
      } else if (cleanId.includes('girish')) {
        user = profiles.find((p: any) => p.id === 'industry-girish');
      } else if (cleanId.includes('raghu')) {
        user = profiles.find((p: any) => p.id === 'industry-raghu');
      } else if (cleanId.includes('raja') || cleanId.includes('shekhar')) {
        user = profiles.find((p: any) => p.id === 'industry-rajashekhar');
      } else if (cleanId.includes('manasa')) {
        user = profiles.find((p: any) => p.id === 'industry-manasa');
      } else if (cleanId.includes('harshitha')) {
        user = profiles.find((p: any) => p.id === 'industry-harshitha');
      } else {
        // Step 3c: Fuzzy Name & Email prefix matching across all students & faculty
        user = profiles.find((p: any) => {
          const name = (p.name || '').toLowerCase();
          const nameAlpha = name.replace(/[^a-z0-9]/g, '');
          const cleanNameOnly = name.replace(/^(mr\.|mrs\.|ms\.|dr\.)\s*/i, '').replace(/[^a-z0-9]/g, '');
          const email = (p.email || '').toLowerCase();
          const emailPrefix = email ? email.split('@')[0] : '';
          const emailAlpha = emailPrefix.replace(/[^a-z0-9]/g, '');

          if (nameAlpha === cleanAlpha || emailAlpha === cleanAlpha || cleanNameOnly === cleanAlpha) return true;
          if (cleanAlpha.length >= 4) {
            if (nameAlpha.includes(cleanAlpha) || cleanAlpha.includes(nameAlpha)) return true;
            if (cleanNameOnly.length >= 4 && (cleanNameOnly.includes(cleanAlpha) || cleanAlpha.includes(cleanNameOnly))) return true;
            if (emailAlpha.includes(cleanEmailPrefix) || cleanEmailPrefix.includes(emailAlpha)) return true;
          }
          return false;
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials. User not found in system.' }, { status: 401 });
    }

    // 4. Check if account requires sign-up (no password set yet)
    if (!user.password && user.role !== 'admin') {
      return NextResponse.json({
        error: 'No password has been registered for this account yet. Please click "New User? Create Account / Sign Up" to set your password and activate your account.',
        needsSignup: true
      }, { status: 401 });
    }

    // 5. Check if account has been activated via email link
    if (user.isActivated === false && user.role !== 'admin') {
      // Secondary check against Cloud KV and disk resolver before rejecting
      try {
        const { resolveUserForAuth, persistProfileToDisk } = await import('@/lib/data/user-resolver');
        const directResolved = await resolveUserForAuth(user.email || user.usn || cleanId);
        if (directResolved?.isActivated) {
          user.isActivated = true;
          user.isFirstLogin = false;
          persistProfileToDisk(user);
          const allP = store.getAllProfiles();
          const inMem = allP.find(p => p.id === user.id || (user.usn && p.usn === user.usn));
          if (inMem) inMem.isActivated = true;
        }
      } catch {}

      if (user.isActivated === false) {
        return NextResponse.json({
          error: `Your account (${user.email || cleanId}) is pending activation. Please check your email inbox and click the activation link to activate your account.`,
          needsActivation: true,
          email: user.email
        }, { status: 403 });
      }
    }

    // 6. Verify password
    const isVerified = verifyPassword(user, cleanPass);
    if (!isVerified) {
      return NextResponse.json({
        error: 'Invalid credentials. Incorrect password. If you forgot your password, please click "Forgot Password".'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user,
      requiresPasswordChange: false,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
