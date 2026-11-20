import { NextResponse } from 'next/server';
import { fetchCloudTeamProof } from '@/lib/data/cloud-sync';
import {
  MAX_FILE_BYTES,
  isBase64Chunk,
  readManifest,
  readPart,
  saveManifest,
  savePart,
  type FileManifest,
} from '@/lib/data/file-chunks';
import { createHash } from 'crypto';
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

    const prefix = `pbl_proof_${teamId}`;
    const manifest = await readManifest(prefix);

    // Manifest for viewers: tells them how many parts exist and what the hash is.
    if (searchParams.get('meta') === '1') {
      if (manifest) {
        return NextResponse.json(manifest, { headers: { 'Cache-Control': 'private, no-cache' } });
      }
      // A proof stored by an older build is served whole; the viewer falls back to it.
      const legacyCloud = await fetchCloudTeamProof(teamId).catch(() => null);
      const legacyLocal = findLocalProof(teamId);
      if (legacyCloud || legacyLocal) {
        return NextResponse.json({ legacy: true }, { headers: { 'Cache-Control': 'private, no-cache' } });
      }
      return NextResponse.json({ error: 'Proof document not found for this team' }, { status: 404 });
    }

    // One part. Safe to cache forever because the URL carries the content hash.
    const partParam = searchParams.get('part');
    if (partParam !== null) {
      if (!manifest) {
        return NextResponse.json({ error: 'No chunked proof is stored for this team' }, { status: 404 });
      }
      const part = Number(partParam);
      if (!Number.isInteger(part) || part < 0 || part >= manifest.totalParts) {
        return NextResponse.json({ error: `part must be between 0 and ${manifest.totalParts - 1}` }, { status: 400 });
      }
      const version = searchParams.get('v');
      if (version && version !== manifest.sha256) {
        return NextResponse.json({ error: 'This proof has been replaced by a newer version.' }, { status: 409 });
      }
      const chunk = await readPart(prefix, part);
      if (!chunk) {
        return NextResponse.json({ error: 'That part is missing from storage.' }, { status: 500 });
      }
      return new Response(new Uint8Array(Buffer.from(chunk, 'base64')), {
        status: 200,
        headers: {
          'Content-Type': manifest.mime,
          'Cache-Control': version
            ? 'public, max-age=31536000, s-maxage=31536000, immutable'
            : 'private, max-age=3600',
        },
      });
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

/**
 * Chunked proof upload. The faculty page sends the proof in parts of at most
 * 3 MB and only records the proof on the team once the server confirms the
 * rebuilt file matches its SHA-256.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const teamId: string = body.teamId;
    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    const { part, totalParts, chunk, mime, sha256, totalLength, version } = body;
    if (!Number.isInteger(part) || part < 0) {
      return NextResponse.json({ error: 'part must be a non-negative integer' }, { status: 400 });
    }
    if (!Number.isInteger(totalParts) || totalParts < 1) {
      return NextResponse.json({ error: 'totalParts must be a positive integer' }, { status: 400 });
    }
    if (part >= totalParts) {
      return NextResponse.json({ error: 'part must be lower than totalParts' }, { status: 400 });
    }
    if (typeof chunk !== 'string' || chunk.length === 0) {
      return NextResponse.json({ error: 'chunk is required' }, { status: 400 });
    }
    if (chunk.length > 3 * 1024 * 1024) {
      return NextResponse.json({ error: 'chunk is larger than the 3 MB part limit' }, { status: 413 });
    }
    if (!isBase64Chunk(chunk)) {
      return NextResponse.json({ error: 'chunk must be base64 text' }, { status: 400 });
    }
    if (Number.isFinite(totalLength) && totalLength > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `File is larger than the ${MAX_FILE_BYTES / (1024 * 1024)} MB limit.` },
        { status: 413 }
      );
    }

    const prefix = `pbl_proof_${teamId}`;
    const saved = await savePart(prefix, part, chunk);
    if (!saved) {
      return NextResponse.json({ error: `Part ${part} could not be stored.` }, { status: 500 });
    }

    if (!body.final) {
      return NextResponse.json({ ok: true, received: part, totalParts });
    }

    if (!Number.isInteger(totalLength) || totalLength < 1) {
      return NextResponse.json({ error: 'totalLength is required on the final part' }, { status: 400 });
    }
    if (typeof sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(sha256)) {
      return NextResponse.json({ error: 'sha256 of the whole file is required on the final part' }, { status: 400 });
    }

    const chunks: string[] = [];
    for (let index = 0; index < totalParts; index++) {
      const stored = await readPart(prefix, index);
      if (!stored) {
        return NextResponse.json(
          { error: `Part ${index} of ${totalParts} never reached storage.` },
          { status: 500 }
        );
      }
      chunks.push(stored);
    }

    const buffer = Buffer.from(chunks.join(''), 'base64');
    if (buffer.length !== totalLength) {
      return NextResponse.json(
        { error: `Uploaded ${buffer.length} bytes but expected ${totalLength}.` },
        { status: 400 }
      );
    }
    const actual = createHash('sha256').update(buffer).digest('hex');
    if (actual !== sha256) {
      return NextResponse.json({ error: 'The uploaded proof does not match its SHA-256.' }, { status: 400 });
    }

    const manifest: FileManifest = {
      version: Number.isInteger(version) ? version : 1,
      totalParts,
      totalLength,
      sha256: actual,
      mime: typeof mime === 'string' && mime ? mime : sniffMime(buffer, 'image/jpeg'),
      updatedAt: new Date().toISOString(),
    };
    if (!(await saveManifest(prefix, manifest))) {
      return NextResponse.json({ error: 'Storage rejected the proof manifest.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, ...manifest });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Proof upload failed' }, { status: 500 });
  }
}
