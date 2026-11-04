import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'https://backend-beta-kohl-9pcedk6q96.vercel.app';
const BACKEND_DATA_PATH = path.join(process.cwd(), 'backend', 'data.json');
const TMP_DATA_PATH = '/tmp/pbl_backend_data.json';

export async function GET() {
  try {
    // 1. If Turso or DATABASE_URL is available, attempt Prisma fetch
    if (process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL) {
      try {
        const { prisma } = await import('@/lib/prisma/client');
        const { seedPrismaDatabase } = await import('@/lib/prisma/seed');
        await seedPrismaDatabase().catch(() => {});

        const [profiles, teams, deadlines, submissions, evaluations, guideMeetings, notifications, auditLogs] = await Promise.all([
          prisma.userProfile.findMany(),
          prisma.team.findMany({
            include: {
              members: {
                include: {
                  user: true,
                },
              },
            },
          }),
          prisma.deadline.findMany(),
          prisma.submission.findMany(),
          prisma.evaluation.findMany(),
          prisma.guideMeeting.findMany(),
          prisma.notification.findMany(),
          prisma.auditLog.findMany(),
        ]);

        const formattedTeams = teams.map((t) => ({
          ...t,
          members: t.members.map((m) => m.user),
        }));

        return NextResponse.json({
          profiles,
          teams: formattedTeams,
          deadlines,
          submissions,
          evaluations,
          guideMeetings,
          notifications,
          auditLogs,
        });
      } catch (prismaErr) {
        console.warn('Prisma query failed, falling back to JSON data:', prismaErr);
      }
    }

    // 2. Try fetching from FastAPI backend if available
    try {
      const fastRes = await fetch(`${FASTAPI_URL}/api/db`, { cache: 'no-store' });
      if (fastRes.ok) {
        const data = await fastRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // FastAPI offline
    }

    // 3. Fallback to /tmp or local backend/data.json
    if (fs.existsSync(TMP_DATA_PATH)) {
      try {
        const raw = fs.readFileSync(TMP_DATA_PATH, 'utf8');
        return NextResponse.json(JSON.parse(raw));
      } catch {}
    }
    if (fs.existsSync(BACKEND_DATA_PATH)) {
      const raw = fs.readFileSync(BACKEND_DATA_PATH, 'utf8');
      const data = JSON.parse(raw);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Backend data not initialized' }, { status: 404 });
  } catch (err: any) {
    console.error('Database query error:', err);
    return NextResponse.json({ error: 'Database query failed', message: err?.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // 1. Forward to FastAPI backend if available
    try {
      await fetch(`${FASTAPI_URL}/api/db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // FastAPI offline
    }

    // 2. Persist to local backend/data.json or /tmp fallback with intelligent non-destructive merge
    let currentData: any = {};
    if (fs.existsSync(TMP_DATA_PATH)) {
      try { currentData = JSON.parse(fs.readFileSync(TMP_DATA_PATH, 'utf8')); } catch {}
    } else if (fs.existsSync(BACKEND_DATA_PATH)) {
      try { currentData = JSON.parse(fs.readFileSync(BACKEND_DATA_PATH, 'utf8')); } catch {}
    }

    // Non-destructive ID-based merging to safely handle 500+ concurrent users

    // 1. Submissions: Merge by ID, preserving existing submissions from all teams
    const subMap = new Map<string, any>((currentData.submissions || []).map((s: any) => [s.id, s]));
    if (payload.submissions && Array.isArray(payload.submissions)) {
      payload.submissions.forEach((s: any) => {
        if (s && s.id) {
          const existing = subMap.get(s.id);
          subMap.set(s.id, { ...existing, ...s });
        }
      });
    }

    // 2. Evaluations: Merge by ID
    const evalMap = new Map<string, any>((currentData.evaluations || []).map((e: any) => [e.id, e]));
    if (payload.evaluations && Array.isArray(payload.evaluations)) {
      payload.evaluations.forEach((e: any) => {
        if (e && e.id) {
          const existing = evalMap.get(e.id);
          evalMap.set(e.id, { ...existing, ...e });
        }
      });
    }

    // 3. Guide Meetings: Merge by ID
    const meetingMap = new Map<string, any>((currentData.guideMeetings || []).map((m: any) => [m.id, m]));
    if (payload.guideMeetings && Array.isArray(payload.guideMeetings)) {
      payload.guideMeetings.forEach((m: any) => {
        if (m && m.id) {
          const existing = meetingMap.get(m.id);
          meetingMap.set(m.id, { ...existing, ...m });
        }
      });
    }

    // 4. Profiles: Merge by ID, protecting custom passwords from stale overwrite
    const profMap = new Map<string, any>((currentData.profiles || []).map((p: any) => [p.id, p]));
    if (payload.profiles && Array.isArray(payload.profiles)) {
      payload.profiles.forEach((p: any) => {
        if (p && p.id) {
          const existing = profMap.get(p.id);
          if (!existing) {
            profMap.set(p.id, p);
          } else {
            const hasCustomPass = !existing.isFirstLogin && !!existing.password;
            const incomingHasCustomPass = !p.isFirstLogin && !!p.password;
            const finalPass = incomingHasCustomPass ? p.password : (hasCustomPass ? existing.password : (p.password || existing.password));
            const finalIsFirstLogin = (hasCustomPass || incomingHasCustomPass) ? false : (p.isFirstLogin !== undefined ? p.isFirstLogin : existing.isFirstLogin);
            profMap.set(p.id, {
              ...existing,
              ...p,
              password: finalPass,
              isFirstLogin: finalIsFirstLogin,
              phone: p.phone || existing.phone,
              passwordUpdatedAt: p.passwordUpdatedAt || existing.passwordUpdatedAt,
            });
          }
        }
      });
    }

    // 5. Teams: Merge by ID, protecting research paper proofs
    const teamMap = new Map<string, any>((currentData.teams || []).map((t: any) => [t.id, t]));
    if (payload.teams && Array.isArray(payload.teams)) {
      payload.teams.forEach((t: any) => {
        if (t && t.id) {
          const existing = teamMap.get(t.id);
          if (!existing) {
            teamMap.set(t.id, t);
          } else {
            const existingTime = existing.researchPaperUpdatedAt ? new Date(existing.researchPaperUpdatedAt).getTime() : 0;
            const incomingTime = t.researchPaperUpdatedAt ? new Date(t.researchPaperUpdatedAt).getTime() : 0;
            const useIncomingProof = incomingTime >= existingTime && Boolean(t.researchPaperProofName || t.researchPaperProofPath);
            teamMap.set(t.id, {
              ...existing,
              ...t,
              researchPaperStatus: useIncomingProof ? (t.researchPaperStatus || existing.researchPaperStatus) : (existing.researchPaperStatus || t.researchPaperStatus),
              researchPaperProofName: useIncomingProof ? t.researchPaperProofName : (existing.researchPaperProofName || t.researchPaperProofName),
              researchPaperProofPath: useIncomingProof ? t.researchPaperProofPath : (existing.researchPaperProofPath || t.researchPaperProofPath),
              researchPaperUpdatedAt: useIncomingProof ? t.researchPaperUpdatedAt : (existing.researchPaperUpdatedAt || t.researchPaperUpdatedAt),
            });
          }
        }
      });
    }

    // 6. Deadlines
    const deadlineMap = new Map<string, any>((currentData.deadlines || []).map((d: any) => [d.id, d]));
    if (payload.deadlines && Array.isArray(payload.deadlines)) {
      payload.deadlines.forEach((d: any) => {
        if (d && d.id) {
          const existing = deadlineMap.get(d.id);
          deadlineMap.set(d.id, { ...existing, ...d });
        }
      });
    }

    // 7. Notifications
    const notifMap = new Map<string, any>((currentData.notifications || []).map((n: any) => [n.id, n]));
    if (payload.notifications && Array.isArray(payload.notifications)) {
      payload.notifications.forEach((n: any) => {
        if (n && n.id) {
          const existing = notifMap.get(n.id);
          notifMap.set(n.id, { ...existing, ...n });
        }
      });
    }

    // 8. Audit Logs
    const auditMap = new Map<string, any>((currentData.auditLogs || []).map((a: any) => [a.id, a]));
    if (payload.auditLogs && Array.isArray(payload.auditLogs)) {
      payload.auditLogs.forEach((a: any) => {
        if (a && a.id) {
          const existing = auditMap.get(a.id);
          auditMap.set(a.id, { ...existing, ...a });
        }
      });
    }

    const merged = {
      profiles: Array.from(profMap.values()),
      teams: Array.from(teamMap.values()),
      deadlines: Array.from(deadlineMap.values()),
      submissions: Array.from(subMap.values()),
      evaluations: Array.from(evalMap.values()),
      guideMeetings: Array.from(meetingMap.values()),
      notifications: Array.from(notifMap.values()),
      auditLogs: Array.from(auditMap.values()),
    };

    try {
      fs.writeFileSync(BACKEND_DATA_PATH, JSON.stringify(merged, null, 2), 'utf8');
    } catch {
      try {
        fs.writeFileSync(TMP_DATA_PATH, JSON.stringify(merged, null, 2), 'utf8');
      } catch {}
    }

    return NextResponse.json({ success: true, message: 'Backend database synced successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to sync database', message: err?.message }, { status: 500 });
  }
}
