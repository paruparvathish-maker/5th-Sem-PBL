import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import {
  fetchCloudTeams,
  mergeTeamRecords,
  saveCloudTeam,
  saveCloudTeamProof,
} from '@/lib/data/cloud-sync';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const BACKEND_DATA_PATH = path.join(process.cwd(), 'backend', 'data.json');
const TMP_DATA_PATH = '/tmp/pbl_backend_data.json';
const PROOFS_DIR = path.join(process.cwd(), 'public', 'storage', 'proofs');
const TMP_PROOFS_DIR = '/tmp/storage/proofs';

function proofApiPath(teamId: string): string {
  return `/api/teams/proof?teamId=${encodeURIComponent(teamId)}`;
}

function persistToDisk(updatedTeams: any[]) {
  const dataPaths = [BACKEND_DATA_PATH, TMP_DATA_PATH];
  for (const dp of dataPaths) {
    try {
      let currentData: any = {};
      if (fs.existsSync(dp)) {
        try {
          currentData = JSON.parse(fs.readFileSync(dp, 'utf8'));
        } catch {}
      }
      if (!currentData.teams) currentData.teams = [];

      const teamMap = new Map<string, any>(currentData.teams.map((t: any) => [t.id, t]));
      updatedTeams.forEach((ut: any) => {
        if (ut && ut.id) {
          teamMap.set(ut.id, mergeTeamRecords(teamMap.get(ut.id), ut));
        }
      });
      currentData.teams = Array.from(teamMap.values());

      fs.writeFileSync(dp, JSON.stringify(currentData, null, 2), 'utf8');
    } catch {
      // Serverless filesystems are read-only; the durable store below is the source of truth.
    }
  }
}

/**
 * Writes the uploaded proof next to the public assets when the filesystem is
 * writable (local development). Returns null when nothing could be written.
 */
function saveProofFileToStorage(teamId: string, proofName: string, proofDataUrl: string): string | null {
  try {
    const matches = proofDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return null;

    const buffer = Buffer.from(matches[2], 'base64');
    const ext = path.extname(proofName) || '.jpg';
    const cleanFileName = `${teamId}${ext}`;
    let written = false;

    for (const dir of [PROOFS_DIR, TMP_PROOFS_DIR]) {
      try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, cleanFileName), buffer);
        written = true;
      } catch {}
    }

    return written ? `/storage/proofs/${cleanFileName}` : null;
  } catch (err) {
    console.warn('Failed to save proof file to storage:', err);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const semesterParam = searchParams.get('semester');
    const semester = semesterParam ? parseInt(semesterParam, 10) : 5;
    const section = searchParams.get('section');
    const guideId = searchParams.get('guide_id');
    const studentId = searchParams.get('student_id');
    const search = searchParams.get('search')?.toLowerCase();

    // Base teams: committed dataset, then merged with the shared durable store.
    let teams = store.getAllTeams();
    if (fs.existsSync(BACKEND_DATA_PATH)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(BACKEND_DATA_PATH, 'utf8'));
        if (Array.isArray(parsed.teams) && parsed.teams.length > 0) teams = parsed.teams;
      } catch {}
    }

    const cloudTeams = await fetchCloudTeams().catch(() => []);
    if (cloudTeams.length > 0) {
      const cloudMap = new Map<string, any>(cloudTeams.map((t: any) => [t.id, t]));
      teams = teams.map((t: any) => (cloudMap.has(t.id) ? mergeTeamRecords(t, cloudMap.get(t.id)) : t));
      cloudTeams.forEach((t: any) => {
        if (t?.id && !teams.some((local: any) => local.id === t.id)) teams.push(t);
      });
    }

    if (!isNaN(semester)) {
      teams = teams.filter((t: any) => (t.semester || 5) === semester);
    }
    if (section && section !== 'ALL') {
      teams = teams.filter((t: any) => (t.section || '').toUpperCase() === section.toUpperCase());
    }
    if (guideId) {
      teams = teams.filter((t: any) => t.guideId === guideId);
    }
    if (studentId) {
      const q = studentId.toLowerCase();
      teams = teams.filter((t: any) =>
        t.members?.some((m: any) => m.id?.toLowerCase() === q || (m.usn && m.usn.toLowerCase() === q))
      );
    }
    if (search) {
      teams = teams.filter(
        (t: any) =>
          (t.teamNumber || '').toLowerCase().includes(search) ||
          (t.projectTitle || '').toLowerCase().includes(search) ||
          (t.guideName && t.guideName.toLowerCase().includes(search)) ||
          t.members?.some(
            (m: any) =>
              (m.name || '').toLowerCase().includes(search) || (m.usn && m.usn.toLowerCase().includes(search))
          )
      );
    }

    const sanitizedTeams = teams.map((t: any) => ({
      ...t,
      members: t.members?.map(({ password, ...mRest }: any) => ({
        ...mRest,
        password: password ? '••••••••' : undefined,
        hasPassword: !!password,
      })),
    }));

    return NextResponse.json(sanitizedTeams);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const applyProof = async (team: any, proofName?: string, proofPath?: string) => {
      if (!proofPath) return team;
      if (!proofPath.startsWith('data:')) return { ...team, researchPaperProofPath: proofPath };

      // Persist the document itself so other devices can open it later.
      await saveCloudTeamProof(team.id, proofPath).catch(() => {});
      const diskPath = proofName ? saveProofFileToStorage(team.id, proofName, proofPath) : null;
      return {
        ...team,
        researchPaperProofPath: diskPath || proofApiPath(team.id),
      };
    };

    // 1. Batch team sync (bidirectional client-to-server uplink)
    if (Array.isArray(body.teams) && body.teams.length > 0) {
      const updatedList: any[] = [];
      for (const t of body.teams) {
        if (!t || !t.id) continue;
        const prepared = await applyProof(t, t.researchPaperProofName, t.researchPaperProofPath);
        prepared.researchPaperUpdatedAt = prepared.researchPaperUpdatedAt || new Date().toISOString();
        store.updateTeam(prepared.id, prepared);
        updatedList.push(prepared);
      }
      persistToDisk(updatedList);

      const results = await Promise.all(updatedList.map((t) => saveCloudTeam(t).catch(() => false)));
      const persisted = results.some(Boolean);
      if (!persisted) {
        return NextResponse.json({
          success: false,
          persisted: false,
          count: updatedList.length,
          warning: 'Teams could not be written to shared storage.',
        });
      }
      return NextResponse.json({ success: true, persisted: true, count: updatedList.length });
    }

    // 2. Single team update
    const { teamId, status, proofName, proofPath, projectTitle, projectDescription, guideId } = body;
    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    const updates: any = {};
    if (status !== undefined) updates.researchPaperStatus = status;
    if (proofName !== undefined) updates.researchPaperProofName = proofName;
    if (projectTitle !== undefined) updates.projectTitle = projectTitle;
    if (projectDescription !== undefined) updates.projectDescription = projectDescription;
    if (guideId !== undefined) updates.guideId = guideId;

    let finalProofPath: string | undefined = proofPath;
    if (proofPath) {
      const prepared = await applyProof({ id: teamId }, proofName, proofPath);
      finalProofPath = prepared.researchPaperProofPath;
      updates.researchPaperProofPath = finalProofPath;
    }

    if (status !== undefined || proofName !== undefined || finalProofPath !== undefined) {
      updates.researchPaperUpdatedAt = new Date().toISOString();
    }

    const updatedTeam = store.updateTeam(teamId, updates);
    persistToDisk([{ id: teamId, ...updates }]);

    const persisted = await saveCloudTeam({ id: teamId, ...updates, ...(updatedTeam || {}) }).catch(() => false);
    if (!persisted) {
      console.error(`[teams] Paper update for ${teamId} could not be written to shared storage.`);
    }

    return NextResponse.json({
      success: true,
      persisted,
      team: updatedTeam,
      proofPath: finalProofPath,
      warning: persisted ? undefined : 'Update saved locally but shared storage rejected the write.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
