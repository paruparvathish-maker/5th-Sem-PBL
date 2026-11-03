import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json();
    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'userId and newPassword are required' }, { status: 400 });
    }

    const success = await store.updatePassword(userId, newPassword);
    if (!success) {
      return NextResponse.json({ error: 'User not found or password update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
