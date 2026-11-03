import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'https://backend-beta-kohl-9pcedk6q96.vercel.app';
const BACKEND_DATA_PATH = path.join(process.cwd(), 'backend', 'data.json');

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

    // 3. Fallback to local backend/data.json
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

    // 2. Persist to local backend/data.json if writable
    try {
      fs.writeFileSync(BACKEND_DATA_PATH, JSON.stringify(payload, null, 2), 'utf8');
    } catch {
      // Read-only filesystem on serverless
    }

    return NextResponse.json({ success: true, message: 'Backend database synced successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to sync database', message: err?.message }, { status: 500 });
  }
}
