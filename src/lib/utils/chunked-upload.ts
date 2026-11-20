/**
 * Browser-side chunked document upload and download.
 *
 * A document is split into parts of at most 3 MB of base64 text, which stays
 * well below Vercel's ~4.5 MB request-body limit. The SHA-256 of the whole file
 * is computed here and checked again on the server before anything is locked,
 * so a partial upload can never be mistaken for a stored report.
 */

/** Base64 characters per part. Divisible by 4 so parts slice cleanly. */
export const PART_CHARS = 3 * 1024 * 1024;
/** Hard limit for one document: 10 MB of real bytes. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export interface UploadResult {
  ok: boolean;
  error?: string;
  sha256?: string;
  totalParts?: number;
  totalLength?: number;
  mime?: string;
}

export interface DocumentManifest {
  version: number;
  totalParts: number;
  totalLength: number;
  sha256: string;
  mime: string;
  updatedAt?: string;
}

function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/\s/g, '');
  const binary = window.atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function decodedLength(base64: string): number {
  const clean = base64.replace(/\s/g, '');
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  return (clean.length / 4) * 3 - padding;
}

/** Rejects anything that is not a base64 data URL, or is over the 10 MB limit. */
export function inspectDataUrl(dataUrl: string): { ok: true; base64: string; mime: string; totalLength: number } | { ok: false; error: string } {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return { ok: false, error: 'That file could not be read. Choose the document again.' };
  }
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return { ok: false, error: 'That file could not be read. Choose the document again.' };
  const header = dataUrl.slice(5, comma);
  if (!/;base64$/.test(header)) {
    return { ok: false, error: 'Only PDF, Word or image files can be uploaded.' };
  }
  const base64 = dataUrl.slice(comma + 1).replace(/\s/g, '');
  const totalLength = decodedLength(base64);
  if (totalLength > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `That file is ${(totalLength / (1024 * 1024)).toFixed(1)} MB. The maximum is 10 MB — compress the PDF and try again.`,
    };
  }
  const mime = header.replace(/;base64$/, '') || 'application/octet-stream';
  return { ok: true, base64, mime, totalLength };
}

async function postPart(url: string, payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string; data?: any }> {
  let lastError = 'The server did not answer.';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
      if (res.ok && data && data.ok !== false) return { ok: true, data };
      lastError =
        (data && (data.error || data.message)) ||
        (res.status === 413
          ? 'The server rejected this part as too large.'
          : `The server answered ${res.status}.`);
      // 4xx answers will not improve on a retry.
      if (res.status >= 400 && res.status < 500) return { ok: false, error: lastError };
    } catch (err: any) {
      lastError = err?.message || 'Network error while uploading.';
    }
  }
  return { ok: false, error: lastError };
}

/**
 * Uploads a document in parts. Nothing is recorded on the server until the final
 * part arrives and the rebuilt file matches the hash.
 */
export async function uploadDocument(options: {
  url: string;
  idField: string;
  id: string;
  version?: number;
  dataUrl: string;
}): Promise<UploadResult> {
  const inspected = inspectDataUrl(options.dataUrl);
  if (!inspected.ok) return { ok: false, error: inspected.error };

  const { base64, mime, totalLength } = inspected;
  const totalParts = Math.max(1, Math.ceil(base64.length / PART_CHARS));
  const sha256 = await sha256Hex(base64ToBytes(base64));

  for (let part = 0; part < totalParts; part++) {
    const chunk = base64.slice(part * PART_CHARS, (part + 1) * PART_CHARS);
    const result = await postPart(options.url, {
      [options.idField]: options.id,
      version: options.version || 1,
      part,
      totalParts,
      chunk,
      mime,
      sha256,
      totalLength,
      final: part === totalParts - 1,
    });
    if (!result.ok) {
      return {
        ok: false,
        error: `Part ${part + 1} of ${totalParts} failed: ${result.error}`,
      };
    }
  }

  return { ok: true, sha256, totalParts, totalLength, mime };
}

export type DownloadResult =
  | { status: 'ok'; bytes: Uint8Array; mime: string; sha256: string }
  | { status: 'legacy' }
  | { status: 'missing'; error?: string };

/**
 * Rebuilds a document from its manifest and parts, verifying the SHA-256 so a
 * truncated or corrupted download is never shown as the student's report.
 */
export async function downloadDocument(options: {
  metaUrl: string;
  partUrl: (part: number, sha256: string) => string;
}): Promise<DownloadResult> {
  let manifest: DocumentManifest | null = null;
  try {
    const res = await fetch(options.metaUrl, { cache: 'no-store' });
    if (res.status === 404) return { status: 'missing' };
    if (!res.ok) return { status: 'missing', error: `The server answered ${res.status}.` };
    const data = await res.json();
    if (data?.legacy) return { status: 'legacy' };
    if (!data || !Number.isInteger(data.totalParts)) return { status: 'missing' };
    manifest = data as DocumentManifest;
  } catch (err: any) {
    return { status: 'missing', error: err?.message || 'Could not reach the server.' };
  }

  const total = manifest;
  const parts: Uint8Array[] = [];
  for (let part = 0; part < total.totalParts; part++) {
    const res = await fetch(options.partUrl(part, total.sha256), { cache: 'force-cache' });
    if (!res.ok) return { status: 'missing', error: `Part ${part + 1} of ${total.totalParts} did not download.` };
    parts.push(new Uint8Array(await res.arrayBuffer()));
  }

  const length = parts.reduce((sum, p) => sum + p.length, 0);
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }

  if (length !== total.totalLength) {
    return { status: 'missing', error: `Downloaded ${length} bytes but expected ${total.totalLength}.` };
  }
  const sha256 = await sha256Hex(bytes);
  if (sha256 !== total.sha256) {
    return { status: 'missing', error: 'The downloaded document does not match its SHA-256.' };
  }

  return { status: 'ok', bytes, mime: total.mime, sha256 };
}

export function bytesToDataUrl(bytes: Uint8Array, mime: string): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
  }
  return `data:${mime || 'application/octet-stream'};base64,${window.btoa(binary)}`;
}

/** Gzip-encodes a JSON body when the browser supports CompressionStream. */
export async function encodeJsonBody(payload: string): Promise<{ body: BodyInit; headers: Record<string, string> }> {
  const baseHeaders = { 'Content-Type': 'application/json' };
  if (typeof CompressionStream === 'undefined') {
    return { body: payload, headers: baseHeaders };
  }
  try {
    const compressed = new Blob([payload]).stream().pipeThrough(new CompressionStream('gzip'));
    const buffer = await new Response(compressed).arrayBuffer();
    return {
      body: buffer,
      headers: { ...baseHeaders, 'Content-Encoding': 'gzip', 'X-PBL-Compressed': 'gzip' },
    };
  } catch {
    return { body: payload, headers: baseHeaders };
  }
}
