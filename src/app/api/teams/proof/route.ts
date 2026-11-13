import { NextResponse } from 'next/server';
import { fetchCloudTeamProof } from '@/lib/data/cloud-sync';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const PROOFS_DIR = path.join(process.cwd(), 'public', 'storage', 'proofs');
const TMP_PROOFS_DIR = '/tmp/storage/proofs';
const BACKEND_DATA_PATH = path.join(process.cwd(), 'backend', 'data.json');
const TMP_DATA_PATH = '/tmp/pbl_backend_data.json';

/** Detect the real type from the bytes: uploaded files are often named .pdf while actually being an image. */
function sniffMime(buffer: Buffer, fileName: string): string {
  if (buffer.length >= 4) {
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return 'application/pdf';
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
    if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      return 'image/webp';
    }
  }

  switch (path.extname(fileName).toLowerCase()) {
    case '.pdf':
      return 'application/pdf';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'application/octet-stream';
  }
}

function inlineResponse(buffer: Buffer, fileName: string) {
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': sniffMime(buffer, fileName),
      'Content-Disposition': `inline; filename="${fileName.replace(/"/g, '')}"`,
      'Cache-Control': 'private, max-age=60',
    },
  });
}

function findLocalProof(teamId: string): { buffer: Buffer; fileName: string } | null {
  const candidates: Array<{ filePath: string; fileName: string; modified: number }> = [];

  for (const dir of [PROOFS_DIR, TMP_PROOFS_DIR]) {
    if (!fs.existsSync(dir)) continue;
    try {
      for (const fileName of fs.readdirSync(dir)) {
        if (!(fileName.startsWith(teamId) || fileName.includes(teamId))) continue;
        const filePath = path.join(dir, fileName);
        try {
          candidates.push({ filePath, fileName, modified: fs.statSync(filePath).mtimeMs });
        } catch {}
      }
    } catch {}
  }

  if (candidates.length === 0) return null;

  // The most recently written file is the faculty upload; older files are seeds.
  candidates.sort((a, b) => b.modified - a.modified);
  try {
    return { buffer: fs.readFileSync(candidates[0].filePath), fileName: candidates[0].fileName };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'teamId query parameter is required' }, { status: 400 });
    }

    // 1. A file written on this host (local development or an existing committed asset).
    const local = findLocalProof(teamId);
    if (local) return inlineResponse(local.buffer, local.fileName);

    // 2. The proof uploaded by faculty, stored in shared durable storage.
    const cloudDataUrl = await fetchCloudTeamProof(teamId).catch(() => null);
    if (cloudDataUrl) {
      const matches = cloudDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        return inlineResponse(Buffer.from(matches[2], 'base64'), `${teamId}-proof`);
      }
    }

    // 3. Fall back to a proof path/base64 recorded on the team record itself.
    let targetTeam: any = null;
    for (const dp of [BACKEND_DATA_PATH, TMP_DATA_PATH]) {
      if (!fs.existsSync(dp)) continue;
      try {
        const parsed = JSON.parse(fs.readFileSync(dp, 'utf8'));
        const found = Array.isArray(parsed.teams) ? parsed.teams.find((t: any) => t.id === teamId) : null;
        if (found && (found.researchPaperProofPath || found.researchPaperProofName)) {
          targetTeam = found;
          break;
        }
      } catch {}
    }

    if (targetTeam) {
      const proofPath: string = targetTeam.researchPaperProofPath || '';
      const proofName: string = targetTeam.researchPaperProofName || `${teamId}-proof.pdf`;

      if (proofPath.startsWith('/storage/proofs/')) {
        const localPath = path.join(process.cwd(), 'public', proofPath);
        if (fs.existsSync(localPath)) {
          return inlineResponse(fs.readFileSync(localPath), proofName);
        }
      }

      const base64Matches = proofPath.match(/^data:([^;]+);base64,(.+)$/);
      if (base64Matches) {
        return inlineResponse(Buffer.from(base64Matches[2], 'base64'), proofName);
      }
    }

    return NextResponse.json({ error: 'Proof document not found for this team' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve proof file', details: err?.message }, { status: 500 });
  }
}

export async function HEAD(request: Request) {
  const response = await GET(request);
  return new Response(null, { status: response.status, headers: response.headers });
}
