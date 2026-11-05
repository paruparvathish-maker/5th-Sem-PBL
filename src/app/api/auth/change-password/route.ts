import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { saveCloudCredentials } from '@/lib/data/cloud-sync';
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

    const cleanPass = String(newPassword).trim();

    // 1. Update in-memory store
    const success = await store.updatePassword(userId, cleanPass);

    // 2. Persist directly into disk backend/data.json or /tmp with automatic fallback
    let persisted = false;
    let data: any = null;
    let sourcePath = fs.existsSync(TMP_DATA_PATH) ? TMP_DATA_PATH : (fs.existsSync(BACKEND_DATA_PATH) ? BACKEND_DATA_PATH : null);
    if (sourcePath) {
      try {
        const raw = fs.readFileSync(sourcePath, 'utf8');
        data = JSON.parse(raw);
      } catch {}
    }
    if (!data && fs.existsSync(BACKEND_DATA_PATH)) {
      try {
        const raw = fs.readFileSync(BACKEND_DATA_PATH, 'utf8');
        data = JSON.parse(raw);
      } catch {}
    }

    let targetProf: any = null;

    if (data && Array.isArray(data.profiles)) {
      const uLower = userId.toLowerCase();
      targetProf = data.profiles.find((p: any) =>
        p.id === userId ||
        (p.email && p.email.toLowerCase() === uLower) ||
        (p.usn && p.usn.toLowerCase() === uLower) ||
        (p.phone && p.phone === userId)
      );
      if (targetProf) {
        targetProf.password = cleanPass;
        targetProf.isFirstLogin = false;
        targetProf.passwordUpdatedAt = new Date().toISOString();
        
        // Add audit log entry
        if (!Array.isArray(data.auditLogs)) data.auditLogs = [];
        data.auditLogs.unshift({
          id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          timestamp: new Date().toISOString(),
          userId: targetProf.id,
          userName: targetProf.name,
          userRole: targetProf.role,
          action: 'Password Updated',
          entityType: 'UserProfile',
          entityId: targetProf.id,
          details: { note: 'Password updated via auth API' }
        });

        // Try writing to BACKEND_DATA_PATH (works on localhost), fallback to TMP_DATA_PATH (works on Vercel)
        try {
          fs.writeFileSync(BACKEND_DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
          persisted = true;
        } catch {
          try {
            fs.writeFileSync(TMP_DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
            persisted = true;
          } catch (tmpErr) {
            console.error('Failed to write password to /tmp fallback:', tmpErr);
          }
        }
      }
    }

    // 3. Persist to high-availability serverless cloud KV for 100% cross-device mobile/laptop sync
    const aliases = targetProf ? [targetProf.id, targetProf.usn, targetProf.email, targetProf.phone].filter(Boolean) : [userId];
    await saveCloudCredentials(
      userId,
      {
        password: cleanPass,
        isFirstLogin: false,
        passwordUpdatedAt: new Date().toISOString()
      },
      aliases
    ).catch(() => {});

    // 4. Best-effort async notification to cloud backend if running
    if (FASTAPI_URL) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        fetch(`${FASTAPI_URL}/api/auth/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, newPassword: cleanPass }),
          signal: controller.signal
        }).catch(() => {}).finally(() => clearTimeout(timeoutId));
      } catch {}
    }

    if (!success && !persisted && !targetProf) {
      return NextResponse.json({ error: 'User not found or password update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
