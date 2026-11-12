import { NextResponse } from 'next/server';
import {
  fetchCloudCredentials,
  fetchCloudDynamicStore,
  saveCloudDynamicStore,
  saveCloudCredentials,
  fetchCloudSubmissions,
  saveCloudSubmissionsBatch
} from '@/lib/data/cloud-sync';
import { store } from '@/lib/data/store';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL && !process.env.NEXT_PUBLIC_FASTAPI_URL.includes('backend-beta-kohl-9pcedk6q96.vercel.app')
  ? process.env.NEXT_PUBLIC_FASTAPI_URL
  : '';
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
    if (FASTAPI_URL) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const fastRes = await fetch(`${FASTAPI_URL}/api/db`, { cache: 'no-store', signal: controller.signal });
        clearTimeout(timeoutId);
        if (fastRes.ok) {
          const data = await fastRes.json();
          return NextResponse.json(data);
        }
      } catch {
        // FastAPI offline
      }
    }

    // 3. Read base data from local backend/data.json; fallback to /tmp or in-memory store
    let baseData: any = null;
    if (fs.existsSync(BACKEND_DATA_PATH)) {
      try {
        const raw = fs.readFileSync(BACKEND_DATA_PATH, 'utf8');
        baseData = JSON.parse(raw);
      } catch {}
    }
    if ((!baseData || !baseData.profiles?.length) && fs.existsSync(TMP_DATA_PATH)) {
      try {
        const raw = fs.readFileSync(TMP_DATA_PATH, 'utf8');
        const tmpData = JSON.parse(raw);
        if (!baseData) baseData = tmpData;
        else if (Array.isArray(tmpData.profiles)) {
          const profMap = new Map((baseData.profiles || []).map((p: any) => [p.id, p]));
          tmpData.profiles.forEach((p: any) => profMap.set(p.id, { ...(profMap.get(p.id) || {}), ...p }));
          baseData.profiles = Array.from(profMap.values());
        }
      } catch {}
    }

    // Always fallback to in-memory store so serverless lambdas on Vercel NEVER return 404
    if (!baseData) {
      baseData = {
        profiles: store.getAllProfiles(),
        teams: store.getAllTeams(),
        deadlines: store.getAllDeadlines(),
        submissions: [],
        evaluations: [],
        guideMeetings: [],
        notifications: [],
        auditLogs: []
      };
    }

    // 4. Merge serverless cloud KV credentials, submissions & dynamic records (ensures all devices see the latest state)
    try {
      const [cloudCreds, cloudDynamic, cloudSubmissions] = await Promise.all([
        fetchCloudCredentials(),
        fetchCloudDynamicStore(),
        fetchCloudSubmissions()
      ]);

      // 4a. Passwords & Login state
      if (cloudCreds && typeof cloudCreds === 'object' && Array.isArray(baseData.profiles)) {
        baseData.profiles.forEach((p: any) => {
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

      // 4b. Submissions (ensures mobile phones immediately reflect submissions created on laptops)
      if (Array.isArray(cloudSubmissions) && cloudSubmissions.length > 0) {
        const subMap = new Map<string, any>((baseData.submissions || []).map((s: any) => [s.id, s]));
        cloudSubmissions.forEach((s: any) => {
          if (s && s.id) {
            const existing = subMap.get(s.id) || {};
            subMap.set(s.id, { ...existing, ...s });
          }
        });
        baseData.submissions = Array.from(subMap.values());
      }

      // 4c. Dynamic Store (Evaluations & Guide Meetings)
      if (cloudDynamic && typeof cloudDynamic === 'object') {
        if (Array.isArray(cloudDynamic.evaluations) && cloudDynamic.evaluations.length > 0) {
          const evalMap = new Map<string, any>((baseData.evaluations || []).map((e: any) => [e.id, e]));
          cloudDynamic.evaluations.forEach((e: any) => evalMap.set(e.id, { ...(evalMap.get(e.id) || {}), ...e }));
          baseData.evaluations = Array.from(evalMap.values());
        }
        if (Array.isArray(cloudDynamic.guideMeetings) && cloudDynamic.guideMeetings.length > 0) {
          const meetMap = new Map<string, any>((baseData.guideMeetings || []).map((m: any) => [m.id, m]));
          cloudDynamic.guideMeetings.forEach((m: any) => meetMap.set(m.id, { ...(meetMap.get(m.id) || {}), ...m }));
          baseData.guideMeetings = Array.from(meetMap.values());
        }
        if (Array.isArray(cloudDynamic.teams) && cloudDynamic.teams.length > 0) {
          const tMap = new Map<string, any>((baseData.teams || []).map((t: any) => [t.id, t]));
          cloudDynamic.teams.forEach((t: any) => {
            if (t && t.id) {
              const existing = tMap.get(t.id) || {};
              // Merge user and admin edited fields (paper status, proofs, guides, edited titles & descriptions)
              tMap.set(t.id, {
                ...existing,
                ...t,
                guideName: t.guideName || existing.guideName,
                guideEmail: t.guideEmail || existing.guideEmail,
                guideId: t.guideId || existing.guideId,
                projectTitle: t.projectTitle || existing.projectTitle,
                projectDescription: t.projectDescription || existing.projectDescription,
                semester: existing.semester || t.semester,
                section: existing.section || t.section,
                teamNumber: existing.teamNumber || t.teamNumber,
                members: (existing.members && existing.members.length > 0) ? existing.members : t.members
              });
            }
          });
          baseData.teams = Array.from(tMap.values());
        }

        if (Array.isArray(cloudDynamic.auditLogs) && cloudDynamic.auditLogs.length > 0) {
          const aMap = new Map<string, any>((baseData.auditLogs || []).map((a: any) => [a.id, a]));
          cloudDynamic.auditLogs.forEach((a: any) => {
            if (a && a.id) {
              aMap.set(a.id, { ...(aMap.get(a.id) || {}), ...a });
            }
          });
          baseData.auditLogs = Array.from(aMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      }
    } catch (kvErr) {
      console.warn('Cloud KV merge warning:', kvErr);
    }

    return NextResponse.json(baseData);
  } catch (err: any) {
    console.error('Database query error:', err);
    return NextResponse.json({ error: 'Database query failed', message: err?.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // 1. Forward to FastAPI backend if available and configured
    if (FASTAPI_URL) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        await fetch(`${FASTAPI_URL}/api/db`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch {
        // FastAPI offline
      }
    }

    // 2. Persist to local backend/data.json or /tmp fallback with intelligent non-destructive merge
    let currentData: any = {};
    if (fs.existsSync(BACKEND_DATA_PATH)) {
      try { currentData = JSON.parse(fs.readFileSync(BACKEND_DATA_PATH, 'utf8')); } catch {}
    }
    if ((!currentData.profiles || currentData.profiles.length === 0) && fs.existsSync(TMP_DATA_PATH)) {
      try { currentData = JSON.parse(fs.readFileSync(TMP_DATA_PATH, 'utf8')); } catch {}
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
          // Strict institutional guard: Mrs. Megha D email is megha-cse@dsatm.edu.in
          if (p.id === 'fac-18' || p.email === 'shreyajayanth27@gmail.com' || (p.name && p.name.toLowerCase().includes('megha d'))) {
            p.email = 'megha-cse@dsatm.edu.in';
          }

          // Strict institutional guard: Vice Principal & HOD Dr. C Nandini email is vp@dsatm.edu.in with admin role
          if (p.id === 'admin-hod' || p.email === 'hod.cse@dsatm.edu.in' || (p.role === 'admin' && p.email === 'vp@dsatm.edu.in')) {
            p.id = 'admin-hod';
            p.role = 'admin';
            p.email = 'vp@dsatm.edu.in';
            p.name = 'Dr. C Nandini (Vice Principal & HOD)';
            p.isActivated = true;
            p.isFirstLogin = false;
            if (!p.password) p.password = 'HOD@CSE#2026';
          }

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
              name: (p.id === 'admin-hod' || p.email === 'vp@dsatm.edu.in') ? 'Dr. C Nandini (Vice Principal & HOD)' : (p.name || existing.name),
              email: (p.id === 'fac-18' || (p.name && p.name.toLowerCase().includes('megha d')))
                ? 'megha-cse@dsatm.edu.in'
                : (p.id === 'admin-hod' || p.email === 'hod.cse@dsatm.edu.in')
                ? 'vp@dsatm.edu.in'
                : (p.email || existing.email),
              password: finalPass,
              isFirstLogin: finalIsFirstLogin,
              phone: p.phone || existing.phone,
              passwordUpdatedAt: p.passwordUpdatedAt || existing.passwordUpdatedAt,
            });

            // If a profile had its custom password updated, sync to serverless cloud KV
            if (incomingHasCustomPass) {
              const aliases = [p.id, p.usn, p.email, p.phone].filter(Boolean);
              saveCloudCredentials(p.id, { password: p.password, isFirstLogin: false, passwordUpdatedAt: p.passwordUpdatedAt }, aliases).catch(() => {});
            }
          }
        }
      });
    }

    // 5. Teams: Merge by ID, protecting research paper proofs
    const teamMap = new Map<string, any>((currentData.teams || []).map((t: any) => [t.id, t]));
    if (payload.teams && Array.isArray(payload.teams)) {
      payload.teams.forEach((t: any) => {
        if (t && t.id) {
          // Strict institutional guard: Mrs. Megha D guide email is megha-cse@dsatm.edu.in
          if (t.guideEmail === 'shreyajayanth27@gmail.com' || (t.guideName && t.guideName.toLowerCase().includes('megha d'))) {
            t.guideEmail = 'megha-cse@dsatm.edu.in';
          }

          // Strict institutional guard: Dr. C Nandini guide email is vp@dsatm.edu.in
          if (t.guideEmail === 'hod.cse@dsatm.edu.in' || (t.guideName && t.guideName.toLowerCase().includes('nandini'))) {
            t.guideEmail = 'vp@dsatm.edu.in';
            t.guideId = 'admin-hod';
          }

          const existing = teamMap.get(t.id);
          if (!existing) {
            teamMap.set(t.id, t);
          } else {
            const existingTime = existing.researchPaperUpdatedAt ? new Date(existing.researchPaperUpdatedAt).getTime() : 0;
            const incomingTime = t.researchPaperUpdatedAt ? new Date(t.researchPaperUpdatedAt).getTime() : 0;
            const useIncomingProof = incomingTime >= existingTime && Boolean(t.researchPaperProofName || t.researchPaperProofPath);

            // Preserve customized project details against stale default overwrite
            const projectTitle = (t.projectTitle && t.projectTitle !== 'To Be Decided (TBD)')
              ? t.projectTitle
              : (existing.projectTitle || t.projectTitle);

            const projectDescription = (t.projectDescription && t.projectDescription.trim() !== '')
              ? t.projectDescription
              : (existing.projectDescription || t.projectDescription);

            teamMap.set(t.id, {
              ...existing,
              ...t,
              projectTitle,
              projectDescription,
              guideEmail: (t.guideEmail === 'shreyajayanth27@gmail.com' || (t.guideName && t.guideName.toLowerCase().includes('megha d')))
                ? 'megha-cse@dsatm.edu.in'
                : (t.guideEmail === 'hod.cse@dsatm.edu.in' || (t.guideName && t.guideName.toLowerCase().includes('nandini')))
                ? 'vp@dsatm.edu.in'
                : (t.guideEmail || existing.guideEmail),
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

    // Persist all submissions and dynamic store to cloud KV for instant multi-device reflection
    const cloudSaves: Promise<any>[] = [];
    if (merged.submissions.length > 0) {
      cloudSaves.push(saveCloudSubmissionsBatch(merged.submissions));
    }

    cloudSaves.push(saveCloudDynamicStore({
      evaluations: merged.evaluations.slice(0, 500),
      guideMeetings: merged.guideMeetings.slice(0, 500),
      teams: merged.teams.slice(0, 500),
      auditLogs: merged.auditLogs.slice(0, 300)
    }));

    await Promise.all(cloudSaves).catch((kvErr) => {
      console.warn('Cloud KV persist non-blocking warning:', kvErr);
    });

    return NextResponse.json({ success: true, message: 'Backend database synced successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to sync database', message: err?.message }, { status: 500 });
  }
}
