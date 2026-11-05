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

  // If user has a custom password and is no longer first login:
  if (user.password && !user.isFirstLogin) {
    return user.password === cleanInput;
  }

  if (user.password && user.password === cleanInput) {
    return true;
  }

  const inputDigits = cleanInput.replace(/\D/g, '');
  if (user.role === 'admin') {
    const phoneDigits = user.phone ? user.phone.replace(/\D/g, '') : '';
    return (
      cleanInput === '03May@2002@' ||
      cleanInput === 'admin123' ||
      cleanInput === (user.password || '') ||
      (inputDigits.length >= 7 && phoneDigits === inputDigits)
    );
  } else if (user.role === 'student') {
    const matchUsn = user.usn && cleanInput.toLowerCase() === user.usn.toLowerCase();
    const matchPhone = user.phone && (cleanInput === user.phone || (inputDigits.length >= 7 && user.phone.replace(/\D/g, '') === inputDigits));
    return Boolean(matchUsn || matchPhone);
  } else if (user.role === 'faculty') {
    const matchPhone = user.phone && (cleanInput === user.phone || (inputDigits.length >= 7 && user.phone.replace(/\D/g, '') === inputDigits));
    const matchStaff = user.staffCode && cleanInput.toLowerCase() === user.staffCode.toLowerCase();
    return Boolean(matchPhone || matchStaff);
  }
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

    // 1. Read profiles from disk to get seed data
    let profiles: any[] = [];
    const targetPath = fs.existsSync(TMP_DATA_PATH) ? TMP_DATA_PATH : (fs.existsSync(BACKEND_DATA_PATH) ? BACKEND_DATA_PATH : null);
    if (targetPath) {
      try {
        const raw = fs.readFileSync(targetPath, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.profiles)) {
          profiles = data.profiles;
        }
      } catch {}
    }

    if (profiles.length === 0) {
      profiles = store.getAllProfiles();
    }

    // 2. Fetch and merge cloud credentials (ensures passwords changed on laptops are instantly available to phones)
    try {
      const cloudCreds = await fetchCloudCredentials();
      if (cloudCreds && typeof cloudCreds === 'object' && Object.keys(cloudCreds).length > 0) {
        profiles.forEach((p: any) => {
          const uLower = (p.id || '').toLowerCase();
          const usnLower = (p.usn || '').toLowerCase();
          const emailLower = (p.email || '').toLowerCase();
          const phoneClean = p.phone || '';

          const record = cloudCreds[p.id] ||
            cloudCreds[uLower] ||
            (usnLower && cloudCreds[usnLower]) ||
            (emailLower && cloudCreds[emailLower]) ||
            (phoneClean && cloudCreds[phoneClean]);

          if (record && record.password) {
            p.password = record.password;
            p.isFirstLogin = record.isFirstLogin ?? false;
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

      return (
        email === cleanId ||
        emailPrefix === cleanId ||
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
      if (['admin', 'administrator', 'mainadmin', 'main admin', 'parvathish', 'parvathisha', 'paru'].includes(cleanId)) {
        user = profiles.find((p: any) => p.id === '180881' || p.email === 'paruparvathish@gmail.com');
      } else if (['hod', 'hodcse', 'hod_cse', 'hod cse', 'nandini'].includes(cleanId)) {
        user = profiles.find((p: any) => p.id === 'admin-hod' || p.email === 'hod.cse@dsatm.edu.in');
      } else if (['principal', 'prin', 'principal office', 'principaldsatm'].includes(cleanId)) {
        user = profiles.find((p: any) => p.id === 'admin-principal' || p.email === 'principal@dsatm.edu.in');
      } else if (cleanId.includes('raghu')) {
        user = profiles.find((p: any) => p.id === 'industry-raghu');
      } else if (cleanId.includes('girish')) {
        user = profiles.find((p: any) => p.id === 'industry-girish');
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

    // 4. Check if initial default credentials have expired (user already created a custom password)
    if (user.password && !user.isFirstLogin) {
      const isDefaultStudent = user.usn && cleanPass.toLowerCase() === user.usn.toLowerCase();
      const isDefaultPhone = user.phone && (cleanPass === user.phone || (cleanPass.replace(/\D/g, '').length >= 7 && user.phone.replace(/\D/g, '') === cleanPass.replace(/\D/g, '')));
      if (isDefaultStudent || isDefaultPhone) {
        return NextResponse.json({
          error: 'Your initial credentials have expired. Please use your newly created password.'
        }, { status: 401 });
      }
    }

    // 5. Verify password
    const isVerified = verifyPassword(user, cleanPass);
    if (!isVerified) {
      return NextResponse.json({ error: 'Invalid credentials. Incorrect password.' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user,
      requiresPasswordChange: Boolean(user.isFirstLogin),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
