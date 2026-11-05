import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
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
    const cleanPass = password !== undefined ? String(password).trim() : '';

    // 1. Read profiles from disk to get latest saved credentials
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

    // 2. Comprehensive identifier matching
    const user = profiles.find((p: any) => {
      const email = p.email?.toLowerCase();
      const usn = p.usn?.toLowerCase();
      const id = p.id?.toLowerCase();
      const phone = p.phone?.toLowerCase();
      const phoneDigits = p.phone ? p.phone.replace(/\D/g, '') : '';
      const staffCode = p.staffCode?.toLowerCase();
      const emailPrefix = email ? email.split('@')[0] : '';
      const name = p.name?.toLowerCase();

      return (
        email === cleanId ||
        emailPrefix === cleanId ||
        usn === cleanId ||
        id === cleanId ||
        staffCode === cleanId ||
        phone === cleanId ||
        (cleanDigits.length >= 7 && phoneDigits === cleanDigits) ||
        (p.id?.startsWith('industry-') && (
          id === `industry-${cleanId}` ||
          emailPrefix.startsWith(cleanId) ||
          (name && name.includes(cleanId))
        ))
      );
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials. User not found in system.' }, { status: 401 });
    }

    // 3. Check if initial default credentials have expired
    if (user.password && !user.isFirstLogin) {
      const isDefaultStudent = user.usn && cleanPass.toLowerCase() === user.usn.toLowerCase();
      const isDefaultPhone = user.phone && (cleanPass === user.phone || (cleanPass.replace(/\D/g, '').length >= 7 && user.phone.replace(/\D/g, '') === cleanPass.replace(/\D/g, '')));
      if (isDefaultStudent || isDefaultPhone) {
        return NextResponse.json({
          error: 'Your initial credentials have expired. Please use your newly created password.'
        }, { status: 401 });
      }
    }

    // 4. Verify password
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
