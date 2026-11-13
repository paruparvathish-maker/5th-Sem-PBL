import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const PROOFS_DIR = path.join(process.cwd(), 'public', 'storage', 'proofs');
const TMP_PROOFS_DIR = '/tmp/storage/proofs';
const BACKEND_DATA_PATH = path.join(process.cwd(), 'backend', 'data.json');
const TMP_DATA_PATH = '/tmp/pbl_backend_data.json';

function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'teamId query parameter is required' }, { status: 400 });
    }

    // 1. Check if public/storage/proofs or /tmp/storage/proofs contains an exact file for this team
    const searchDirs = [PROOFS_DIR, TMP_PROOFS_DIR];
    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir);
          const matched = files.find(f => f.startsWith(teamId) || f.includes(teamId));
          if (matched) {
            const filePath = path.join(dir, matched);
            const fileBuffer = fs.readFileSync(filePath);
            const mimeType = getMimeType(matched);
            return new Response(fileBuffer, {
              status: 200,
              headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `inline; filename="${matched}"`,
                'Cache-Control': 'public, max-age=3600',
              },
            });
          }
        } catch {}
      }
    }

    // 2. Fallback: inspect backend/data.json or /tmp/pbl_backend_data.json for team proof path or base64
    let targetTeam: any = null;
    const dataPaths = [BACKEND_DATA_PATH, TMP_DATA_PATH];
    for (const dp of dataPaths) {
      if (fs.existsSync(dp)) {
        try {
          const raw = fs.readFileSync(dp, 'utf8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.teams)) {
            const found = parsed.teams.find((t: any) => t.id === teamId);
            if (found && (found.researchPaperProofPath || found.researchPaperProofName)) {
              targetTeam = found;
              break;
            }
          }
        } catch {}
      }
    }

    if (targetTeam) {
      const proofPath = targetTeam.researchPaperProofPath || '';
      const proofName = targetTeam.researchPaperProofName || `${teamId}-proof.pdf`;

      // Check if proofPath is a direct relative file on disk
      if (proofPath.startsWith('/storage/proofs/')) {
        const localPath = path.join(process.cwd(), 'public', proofPath);
        if (fs.existsSync(localPath)) {
          const fileBuffer = fs.readFileSync(localPath);
          const mimeType = getMimeType(proofName);
          return new Response(fileBuffer, {
            status: 200,
            headers: {
              'Content-Type': mimeType,
              'Content-Disposition': `inline; filename="${proofName}"`,
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      }

      // Check if proofPath is a base64 Data URI
      if (proofPath.startsWith('data:')) {
        const matches = proofPath.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mime = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          return new Response(buffer, {
            status: 200,
            headers: {
              'Content-Type': mime,
              'Content-Disposition': `inline; filename="${proofName}"`,
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      }
    }

    return NextResponse.json({ error: 'Proof document not found for this team' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve proof file', details: err?.message }, { status: 500 });
  }
}
