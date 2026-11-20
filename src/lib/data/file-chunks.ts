import { createHash } from 'crypto';
import { readDoc, writeDoc } from './persistence';

/**
 * Chunked document storage for submission reports and research-paper proofs.
 *
 * A whole document used to travel as one JSON body containing its base64 data
 * URL. Vercel rejects request bodies over ~4.5 MB with a 413, so any report over
 * roughly 3.3 MB could never be stored, and one team's 24-page report was locked
 * in the index while its file was silently missing.
 *
 * Documents are now stored as base64 parts of at most 3 MB plus a manifest that
 * carries the whole file's SHA-256. A part is only considered stored when the
 * database write reported success, and the manifest is written only after every
 * part is present and the rebuilt file matches the hash and the length.
 */
/** Maximum base64 characters accepted in a single part (3 MB). */
export const MAX_PART_CHARS = 3 * 1024 * 1024;
/** Maximum size of one real document (10 MB of bytes). */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export interface FileManifest {
  version: number;
  totalParts: number;
  totalLength: number;
  sha256: string;
  mime: string;
  updatedAt: string;
}

export const manifestKey = (prefix: string) => `${prefix}__meta`;
export const partKey = (prefix: string, part: number) => `${prefix}__p${part}`;

const BASE64_RE = /^[A-Za-z0-9+/\r\n]+={0,2}$/;

export function isBase64Chunk(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_PART_CHARS &&
    BASE64_RE.test(value)
  );
}

export async function readManifest(prefix: string): Promise<FileManifest | null> {
  const raw = await readDoc<any>(manifestKey(prefix)).catch(() => null);
  if (!raw || typeof raw !== 'object') return null;
  const manifest = raw as FileManifest;
  if (!Number.isInteger(manifest.totalParts) || manifest.totalParts < 1) return null;
  if (!Number.isInteger(manifest.totalLength) || manifest.totalLength < 1) return null;
  if (typeof manifest.sha256 !== 'string' || !manifest.sha256) return null;
  return manifest;
}

export async function saveManifest(prefix: string, manifest: FileManifest): Promise<boolean> {
  return writeDoc(manifestKey(prefix), manifest);
}

export async function readPart(prefix: string, part: number): Promise<string | null> {
  const value = await readDoc<string>(partKey(prefix, part)).catch(() => null);
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export async function savePart(prefix: string, part: number, chunk: string): Promise<boolean> {
  return writeDoc(partKey(prefix, part), chunk);
}

/** The single-document form written by older builds (`pbl_file_<id>`). */
export async function readLegacyDocument(prefix: string): Promise<string | null> {
  const value = await readDoc<string>(prefix).catch(() => null);
  return typeof value === 'string' && value.length > 50 ? value : null;
}

export function decodeDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  if (typeof dataUrl !== 'string') return null;
  let value = dataUrl.trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  const match = /^data:([^;,]+)?(?:;charset=[^;,]+)?(?:;base64)?,([\s\S]*)$/.exec(value);
  if (!match) return null;
  const isBase64 = /;base64,/.test(value.slice(0, 200));
  try {
    const buffer = isBase64 ? Buffer.from(match[2], 'base64') : Buffer.from(decodeURIComponent(match[2]), 'utf8');
    return { mime: match[1] || 'application/octet-stream', buffer };
  } catch {
    return null;
  }
}

/** Detects the real type from the bytes; uploads are often named .pdf but are images. */
export function sniffMime(buffer: Buffer, fallback: string): string {
  if (buffer.length >= 4) {
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return 'application/pdf';
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
    if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      return 'image/webp';
    }
    if (buffer.length >= 4 && buffer.toString('ascii', 0, 4) === 'PK\u0003\u0004') {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
  }
  return fallback || 'application/octet-stream';
}

/**
 * Rebuilds a document from its parts. Returns an error instead of a partial file
 * when a part is missing, the length differs, or the hash does not match.
 */
export async function assembleDocument(
  prefix: string,
  manifest: FileManifest
): Promise<{ buffer: Buffer } | { error: string; status: number }> {
  const chunks: string[] = [];
  for (let index = 0; index < manifest.totalParts; index++) {
    const chunk = await readPart(prefix, index);
    if (!chunk) return { error: `Part ${index} of ${manifest.totalParts} is missing from storage.`, status: 500 };
    chunks.push(chunk);
  }
  const buffer = Buffer.from(chunks.join(''), 'base64');
  if (buffer.length !== manifest.totalLength) {
    return { error: `Rebuilt document is ${buffer.length} bytes, expected ${manifest.totalLength}.`, status: 500 };
  }
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  if (sha256 !== manifest.sha256) {
    return { error: 'Rebuilt document does not match the stored SHA-256.', status: 500 };
  }
  return { buffer };
}
