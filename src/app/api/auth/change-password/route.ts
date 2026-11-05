import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const BACKEND_DATA_PATH = path.join(process.cwd(), 'backend', 'data.json');
const TMP_DATA_PATH = '/tmp/pbl_backend_data.json';
const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL && !process.env.NEXT_PUBLIC_FASTAPI_URL.includes('backend-beta-kohl-9pcedk6q96.vercel.app')
  ? process.env.NEXT_PUBLIC_FASTAPI_URL
  : '';

export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json();
    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'userId and newPassword are required' }, { status: 400 });
    }

    // 1. Update in-memory store
    const success = await store.updatePassword(userId, newPassword);

    // 2. Persist directly into disk backend/data.json
    let persisted = false;
    let targetPath = fs.existsSync(BACKEND_DATA_PATH) ? BACKEND_DATA_PATH : (fs.existsSync(TMP_DATA_PATH) ? TMP_DATA_PATH : null);
    
    if (targetPath) {
      try {
        const raw = fs.readFileSync(targetPath, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.profiles)) {
          const uLower = userId.toLowerCase();
          const prof = data.profiles.find((p: any) =>
            p.id === userId ||
            (p.email && p.email.toLowerCase() === uLower) ||
            (p.usn && p.usn.toLowerCase() === uLower) ||
            (p.phone && p.phone === userId)
          );
          if (prof) {
            prof.password = newPassword;
            prof.isFirstLogin = false;
            prof.passwordUpdatedAt = new Date().toISOString();
            
            // Add audit log entry
            if (!Array.isArray(data.auditLogs)) data.auditLogs = [];
            data.auditLogs.unshift({
              id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
              timestamp: new Date().toISOString(),
              userId: prof.id,
              userName: prof.name,
              userRole: prof.role,
              action: 'Password Updated',
              entityType: 'UserProfile',
              entityId: prof.id,
              details: { note: 'Password updated via auth API' }
            });

            fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf8');
            persisted = true;
          }
        }
      } catch (fsErr) {
        console.error('Failed to persist changed password to file:', fsErr);
      }
    }

    // 3. Best-effort async notification to cloud backend if running
    if (FASTAPI_URL) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        fetch(`${FASTAPI_URL}/api/auth/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, newPassword }),
          signal: controller.signal
        }).catch(() => {}).finally(() => clearTimeout(timeoutId));
      } catch {}
    }

    if (!success && !persisted) {
      return NextResponse.json({ error: 'User not found or password update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
