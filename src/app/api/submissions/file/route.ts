import { NextResponse } from 'next/server';
import { fetchInlineSubmissionFromIndex, saveCloudSubmissionFile } from '@/lib/data/cloud-sync';
import {
  MAX_FILE_BYTES,
  assembleDocument,
  decodeDataUrl,
  isBase64Chunk,
  readLegacyDocument,
  readManifest,
  readPart,
  saveManifest,
  savePart,
  sniffMime,
  type FileManifest,
} from '@/lib/data/file-chunks';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

const prefixFor = (submissionId: string) => `pbl_file_${submissionId}`;

function inlineBody(buffer: Buffer, mime: string, cacheControl: string) {
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': sniffMime(buffer, mime),
      'Content-Disposition': 'inline',
      'Content-Length': String(buffer.length),
      'Cache-Control': cacheControl,
    },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 });
    }

    const prefix = prefixFor(id);
    const manifest = await readManifest(prefix);

    // 1. Manifest: tells the viewer how many parts exist and what the hash is.
    if (searchParams.get('meta') === '1') {
      if (manifest) {
        return NextResponse.json(manifest, { headers: { 'Cache-Control': 'private, no-cache' } });
      }
      // A document written by an older build is stored whole; the viewer opens it
      // as one file instead of looking for parts that were never created.
      const legacy = await readLegacyDocument(prefix);
      const inline = legacy ? null : await fetchInlineSubmissionFromIndex(id).catch(() => null);
      if (legacy || inline) {
        return NextResponse.json({ legacy: true }, { headers: { 'Cache-Control': 'private, no-cache' } });
      }
      return NextResponse.json({ error: 'No document is stored for this submission.' }, { status: 404 });
    }

    // 2. One part. Safe to cache forever because the URL carries the content hash.
    const partParam = searchParams.get('part');
    if (partParam !== null) {
      if (!manifest) {
        return NextResponse.json({ error: 'No document is stored for this submission.' }, { status: 404 });
      }
      const part = Number(partParam);
      if (!Number.isInteger(part) || part < 0 || part >= manifest.totalParts) {
        return NextResponse.json({ error: `part must be between 0 and ${manifest.totalParts - 1}` }, { status: 400 });
      }
      const version = searchParams.get('v');
      if (version && version !== manifest.sha256) {
        return NextResponse.json({ error: 'This document has been replaced by a newer version.' }, { status: 409 });
      }
      const chunk = await readPart(prefix, part);
      if (!chunk) {
        return NextResponse.json({ error: 'That part is missing from storage.' }, { status: 500 });
      }
      const buffer = Buffer.from(chunk, 'base64');
      const cacheControl = version
        ? 'public, max-age=31536000, s-maxage=31536000, immutable'
        : 'private, max-age=3600';
      return inlineBody(buffer, manifest.mime, cacheControl);
    }

    // 3. Whole document: rebuilt from parts, or the single document older builds wrote.
    if (manifest) {
      const assembled = await assembleDocument(prefix, manifest);
      if ('error' in assembled) {
        return NextResponse.json({ error: assembled.error }, { status: assembled.status });
      }
      return inlineBody(assembled.buffer, manifest.mime, 'private, max-age=3600');
    }

    const legacy = await readLegacyDocument(prefix);
    if (legacy) {
      const decoded = decodeDataUrl(legacy);
      if (decoded) {
        return inlineBody(decoded.buffer, decoded.mime, 'private, max-age=3600');
      }
    }

    return NextResponse.json({ error: 'Document file not found in cloud storage' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to read document' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 });
    }

    // Older clients still POST the whole document as one data URL.
    if (typeof body.fileData === 'string' && !body.chunk) {
      const ok = await saveCloudSubmissionFile(submissionId, body.fileData);
      if (!ok) {
        return NextResponse.json({ error: 'Storage rejected the document. Nothing was saved.' }, { status: 500 });
      }
      const decoded = decodeDataUrl(body.fileData);
      return NextResponse.json({
        ok: true,
        legacy: true,
        totalLength: decoded ? decoded.buffer.length : null,
        sha256: decoded ? createHash('sha256').update(decoded.buffer).digest('hex') : null,
      });
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
      return NextResponse.json(
        { error: 'chunk is larger than the 3 MB part limit' },
        { status: 413 }
      );
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

    const prefix = prefixFor(submissionId);
    const saved = await savePart(prefix, part, chunk);
    if (!saved) {
      return NextResponse.json({ error: `Part ${part} could not be stored.` }, { status: 500 });
    }

    if (!body.final) {
      return NextResponse.json({ ok: true, received: part, totalParts });
    }

    // Final call: every part must be present, and the rebuilt file must match the hash.
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
          { error: `Part ${index} of ${totalParts} never reached storage. Nothing was locked.` },
          { status: 500 }
        );
      }
      chunks.push(stored);
    }

    const buffer = Buffer.from(chunks.join(''), 'base64');
    if (buffer.length !== totalLength) {
      return NextResponse.json(
        { error: `Uploaded ${buffer.length} bytes but expected ${totalLength}. Nothing was locked.` },
        { status: 400 }
      );
    }
    const actual = createHash('sha256').update(buffer).digest('hex');
    if (actual !== sha256) {
      return NextResponse.json(
        { error: 'The uploaded file does not match its SHA-256. Nothing was locked.' },
        { status: 400 }
      );
    }

    const manifest: FileManifest = {
      version: Number.isInteger(version) ? version : 1,
      totalParts,
      totalLength,
      sha256: actual,
      mime: typeof mime === 'string' && mime ? mime : sniffMime(buffer, 'application/pdf'),
      updatedAt: new Date().toISOString(),
    };
    const manifestSaved = await saveManifest(prefix, manifest);
    if (!manifestSaved) {
      return NextResponse.json({ error: 'Storage rejected the document manifest.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, ...manifest });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 });
  }
}
