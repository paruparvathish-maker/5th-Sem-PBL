import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { fetchCloudDynamicStore, saveCloudDynamicStore } from '@/lib/data/cloud-sync';
import { AuditLogItem } from '@/lib/types/pbl';

export const dynamic = 'force-dynamic';

const BACKEND_DATA_PATH = path.join(process.cwd(), 'backend', 'data.json');
const TMP_DATA_PATH = '/tmp/pbl_backend_data.json';

export async function GET() {
  try {
    let auditLogs: AuditLogItem[] = [];

    if (fs.existsSync(BACKEND_DATA_PATH)) {
      try {
        const raw = fs.readFileSync(BACKEND_DATA_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.auditLogs)) {
          auditLogs = parsed.auditLogs;
        }
      } catch {}
    }

    if (auditLogs.length === 0 && fs.existsSync(TMP_DATA_PATH)) {
      try {
        const raw = fs.readFileSync(TMP_DATA_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.auditLogs)) {
          auditLogs = parsed.auditLogs;
        }
      } catch {}
    }

    try {
      const cloudDynamic = await fetchCloudDynamicStore();
      if (cloudDynamic && Array.isArray(cloudDynamic.auditLogs) && cloudDynamic.auditLogs.length > 0) {
        const logMap = new Map(auditLogs.map(l => [l.id, l]));
        cloudDynamic.auditLogs.forEach((l: AuditLogItem) => {
          if (l && l.id) logMap.set(l.id, { ...(logMap.get(l.id) || {}), ...l });
        });
        auditLogs = Array.from(logMap.values());
      }
    } catch {}

    auditLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, auditLogs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch audit logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, userName, userRole, action, entityType, entityId, details } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const newLog: AuditLogItem = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: userId || 'system',
      userName: userName || 'System User',
      userRole: userRole || 'system',
      action: String(action),
      entityType: entityType || 'System',
      entityId: entityId || undefined,
      details: details || undefined,
      createdAt: new Date().toISOString()
    };

    // Update disk file backend/data.json and /tmp fallback
    const targetPaths = [BACKEND_DATA_PATH, TMP_DATA_PATH];
    for (const targetPath of targetPaths) {
      try {
        let currentData: any = { auditLogs: [] };
        if (fs.existsSync(targetPath)) {
          try {
            currentData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
          } catch {}
        }
        if (!Array.isArray(currentData.auditLogs)) {
          currentData.auditLogs = [];
        }

        currentData.auditLogs.unshift(newLog);
        if (currentData.auditLogs.length > 500) {
          currentData.auditLogs = currentData.auditLogs.slice(0, 500);
        }

        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(targetPath, JSON.stringify(currentData, null, 2), 'utf8');
      } catch {}
    }

    // Persist to Cloud KV for multi-device sync
    try {
      const cloudDynamic = (await fetchCloudDynamicStore()) || {};
      const existingLogs: AuditLogItem[] = Array.isArray(cloudDynamic.auditLogs) ? cloudDynamic.auditLogs : [];
      existingLogs.unshift(newLog);
      await saveCloudDynamicStore({
        ...cloudDynamic,
        auditLogs: existingLogs.slice(0, 300)
      });
    } catch {}

    return NextResponse.json({ success: true, log: newLog });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record audit log' }, { status: 500 });
  }
}

