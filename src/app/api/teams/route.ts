import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const BACKEND_DATA_PATH = path.join(process.cwd(), 'backend', 'data.json');
const TMP_DATA_PATH = '/tmp/pbl_backend_data.json';
const PROOFS_DIR = path.join(process.cwd(), 'public', 'storage', 'proofs');
const TMP_PROOFS_DIR = '/tmp/storage/proofs';

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
          const existing = teamMap.get(ut.id) || {};
          teamMap.set(ut.id, { ...existing, ...ut });
        }
      });
      currentData.teams = Array.from(teamMap.values());

      fs.writeFileSync(dp, JSON.stringify(currentData, null, 2), 'utf8');
    } catch {}
  }
}

function saveProofFileToStorage(teamId: string, proofName: string, proofDataUrl: string): string {
  try {
    const matches = proofDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return proofDataUrl;

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = path.extname(proofName) || '.jpg';
    const cleanFileName = `${teamId}${ext}`;

    const targetDirs = [PROOFS_DIR, TMP_PROOFS_DIR];
    for (const dir of targetDirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(path.join(dir, cleanFileName), buffer);
        if (proofName && proofName !== cleanFileName) {
          fs.writeFileSync(path.join(dir, proofName), buffer);
        }
      } catch {}
    }

    return `/storage/proofs/${cleanFileName}`;
  } catch (err) {
    console.warn('Failed to save proof file to storage:', err);
    return proofDataUrl;
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

    // Load latest teams from disk or fallback to in-memory store
    let teams = store.getAllTeams();
    if (fs.existsSync(BACKEND_DATA_PATH)) {
      try {
        const raw = fs.readFileSync(BACKEND_DATA_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.teams) && parsed.teams.length > 0) {
          teams = parsed.teams;
        }
      } catch {}
    }

    // Semester filter (default 5th sem)
    if (!isNaN(semester)) {
      teams = teams.filter((t) => (t.semester || 5) === semester);
    }

    // Section filter
    if (section && section !== 'ALL') {
      teams = teams.filter((t) => t.section.toUpperCase() === section.toUpperCase());
    }

    // Guide filter
    if (guideId) {
      teams = teams.filter((t) => t.guideId === guideId);
    }

    // Student member filter
    if (studentId) {
      const q = studentId.toLowerCase();
      teams = teams.filter((t) =>
        t.members?.some(
          (m: any) => m.id.toLowerCase() === q || (m.usn && m.usn.toLowerCase() === q)
        )
      );
    }

    // Search filter
    if (search) {
      teams = teams.filter(
        (t) =>
          t.teamNumber.toLowerCase().includes(search) ||
          t.projectTitle.toLowerCase().includes(search) ||
          (t.guideName && t.guideName.toLowerCase().includes(search)) ||
          t.members?.some(
            (m: any) =>
              m.name.toLowerCase().includes(search) ||
              (m.usn && m.usn.toLowerCase().includes(search))
          )
      );
    }

    const sanitizedTeams = teams.map((t) => ({
      ...t,
      members: t.members?.map(({ password, ...mRest }: any) => ({
        ...mRest,
        password: password ? '••••••••' : undefined,
        hasPassword: !!password
      }))
    }));

    return NextResponse.json(sanitizedTeams);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // 1. Handle batch team sync (bidirectional client-to-server uplink)
    if (Array.isArray(body.teams) && body.teams.length > 0) {
      const updatedList: any[] = [];
      body.teams.forEach((t: any) => {
        if (t && t.id) {
          let proofPath = t.researchPaperProofPath;
          if (proofPath && proofPath.startsWith('data:') && t.researchPaperProofName) {
            proofPath = saveProofFileToStorage(t.id, t.researchPaperProofName, proofPath);
            t.researchPaperProofPath = proofPath;
          }
          store.updateTeam(t.id, t);
          updatedList.push(t);
        }
      });
      persistToDisk(updatedList);
      return NextResponse.json({ success: true, count: updatedList.length });
    }

    // 2. Handle single team update
    const { teamId, status, proofName, proofPath, projectTitle, projectDescription, guideId } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    let finalProofPath = proofPath;
    if (proofPath && proofPath.startsWith('data:') && proofName) {
      finalProofPath = saveProofFileToStorage(teamId, proofName, proofPath);
    }

    const updates: any = {};
    if (status !== undefined) updates.researchPaperStatus = status;
    if (proofName !== undefined) updates.researchPaperProofName = proofName;
    if (finalProofPath !== undefined) updates.researchPaperProofPath = finalProofPath;
    if (status || proofName || finalProofPath) updates.researchPaperUpdatedAt = new Date().toISOString();
    if (projectTitle !== undefined) updates.projectTitle = projectTitle;
    if (projectDescription !== undefined) updates.projectDescription = projectDescription;
    if (guideId !== undefined) updates.guideId = guideId;

    const updatedTeam = store.updateTeam(teamId, updates);
    persistToDisk([{ id: teamId, ...updates }]);

    return NextResponse.json({ success: true, team: updatedTeam, proofPath: finalProofPath });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
