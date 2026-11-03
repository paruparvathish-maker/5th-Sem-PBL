import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();
    if (!identifier) {
      return NextResponse.json({ error: 'Identifier is required' }, { status: 400 });
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const cleanDigits = cleanId.replace(/\D/g, '');
    const profiles = store.getAllProfiles();

    const user = profiles.find((p) => {
      const email = p.email?.toLowerCase();
      const usn = p.usn?.toLowerCase();
      const id = p.id?.toLowerCase();
      const phone = p.phone?.toLowerCase();
      const phoneDigits = p.phone ? p.phone.replace(/\D/g, '') : '';
      const staffCode = p.staffCode?.toLowerCase();

      return (
        email === cleanId ||
        usn === cleanId ||
        id === cleanId ||
        staffCode === cleanId ||
        phone === cleanId ||
        (cleanDigits.length >= 7 && phoneDigits === cleanDigits)
      );
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const isVerified = store.verifyPassword(user.id, password || '');
    if (!isVerified) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user,
      requiresPasswordChange: user.isFirstLogin,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

