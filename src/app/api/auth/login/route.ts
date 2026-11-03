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
    const profiles = store.getAllProfiles();

    const user = profiles.find((p) => {
      const email = p.email?.toLowerCase();
      const usn = p.usn?.toLowerCase();
      const id = p.id?.toLowerCase();
      return email === cleanId || usn === cleanId || id === cleanId;
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const expectedPassword = user.password || user.usn || user.phone || '123456';
    if (password && password !== expectedPassword) {
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

