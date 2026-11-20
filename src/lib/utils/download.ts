/**
 * Universal document and image viewer for student submissions and guide proofs.
 *
 * Opens documents (PDF, images, Word) in a new browser tab for preview without
 * downloading them to disk.
 *
 * A viewer must never invent a document. Older builds, when the server had no
 * file, generated a one-page PDF containing the AI summary and showed it as if
 * it were the student's report. Faculty then reviewed a page of text instead of
 * a 24-page report. Now a missing file is reported as missing.
 */

import { getFileFromIdb } from './idb-storage';
import { downloadDocument } from './chunked-upload';

export const DOCUMENT_MISSING_MESSAGE =
  'This document has not reached the server yet. Ask the team to open their Submissions page on the device they uploaded from.';

export const PROOF_MISSING_MESSAGE =
  'This proof has not reached the server yet. Ask the faculty member to open the Mentorship page on the device they uploaded from.';

export function dataUriToBlobUrl(dataUri: string, defaultMime: string = 'application/pdf'): string {
  if (!dataUri) return '';
  if (dataUri.startsWith('blob:') || dataUri.startsWith('http://') || dataUri.startsWith('https://')) {
    return dataUri;
  }

  try {
    const parts = dataUri.split(',');
    const header = parts[0] || '';
    const base64Data = parts[1] || '';
    const mimeMatch = header.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : defaultMime;

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mime });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('Failed to convert data URI to Blob URL:', err);
    return dataUri;
  }
}

/**
 * Opens any URL or Blob URL in a new tab without downloading
 */
export function openInNewTab(url: string) {
  if (!url || url === '#' || url === 'undefined') {
    alert('No document or proof file is available to view.');
    return;
  }

  const newTab = window.open(url, '_blank', 'noopener,noreferrer');
  if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
    // Fallback if browser popup blocker blocked window.open
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

function openBytes(bytes: Uint8Array, mime: string) {
  const blob = new Blob([bytes as unknown as BlobPart], { type: mime || 'application/octet-stream' });
  openInNewTab(URL.createObjectURL(blob));
}

/**
 * Opens a faculty or student proof document or image in another tab.
 * Resolves from a direct data URI, this browser's IndexedDB copy, or the server.
 */
export async function viewProofFile(proofPath?: string, proofName?: string, teamId?: string) {
  // 1. A copy already held in this page (for example right after an upload).
  if (proofPath && proofPath.startsWith('data:')) {
    openInNewTab(dataUriToBlobUrl(proofPath));
    return;
  }

  if (teamId) {
    // 2. This browser's copy of the file.
    const cached = await getFileFromIdb(`proof_${teamId}`).catch(() => null);
    if (cached && cached.startsWith('data:')) {
      openInNewTab(dataUriToBlobUrl(cached));
      return;
    }

    // 3. The server: parts are cached forever by the content hash.
    const result = await downloadDocument({
      metaUrl: `/api/teams/proof?teamId=${encodeURIComponent(teamId)}&meta=1`,
      partUrl: (part, sha) =>
        `/api/teams/proof?teamId=${encodeURIComponent(teamId)}&part=${part}&v=${sha}`,
    });
    if (result.status === 'ok') {
      openBytes(result.bytes, result.mime);
      return;
    }
    if (result.status === 'legacy') {
      openInNewTab(`/api/teams/proof?teamId=${encodeURIComponent(teamId)}`);
      return;
    }
  }

  // 4. A directly reachable URL recorded on the team.
  if (proofPath && (proofPath.startsWith('http://') || proofPath.startsWith('https://') || proofPath.startsWith('/storage/'))) {
    openInNewTab(proofPath);
    return;
  }

  alert(PROOF_MISSING_MESSAGE);
}

/**
 * Universal submission document viewer.
 * Opens the document this browser holds, or rebuilds it from the server's parts,
 * verifying the SHA-256 first. Never substitutes a generated page.
 */
export async function viewSubmissionFile(sub: {
  id?: string;
  fileName?: string;
  filePath?: string;
  fileData?: string;
}) {
  // 1. A copy already held in this page.
  const inline = sub.fileData || (sub.filePath && sub.filePath.startsWith('data:') ? sub.filePath : '');
  if (inline && inline.startsWith('data:')) {
    openInNewTab(dataUriToBlobUrl(inline));
    return;
  }

  const id = sub.id;
  if (!id) {
    alert(DOCUMENT_MISSING_MESSAGE);
    return;
  }

  // 2. This browser's copy of the file.
  const cached = await getFileFromIdb(id).catch(() => null);
  if (cached && cached.startsWith('data:')) {
    openInNewTab(dataUriToBlobUrl(cached));
    return;
  }

  // 3. The server: parts are cached forever by the content hash.
  const result = await downloadDocument({
    metaUrl: `/api/submissions/file?id=${encodeURIComponent(id)}&meta=1`,
    partUrl: (part, sha) => `/api/submissions/file?id=${encodeURIComponent(id)}&part=${part}&v=${sha}`,
  });
  if (result.status === 'ok') {
    openBytes(result.bytes, result.mime);
    return;
  }
  if (result.status === 'legacy') {
    openInNewTab(`/api/submissions/file?id=${encodeURIComponent(id)}`);
    return;
  }

  alert(DOCUMENT_MISSING_MESSAGE);
}

/**
 * Backward compatibility alias so existing calls to downloadSubmissionFile
 * seamlessly open the document in a new tab WITHOUT downloading.
 */
export async function downloadSubmissionFile(sub: {
  id?: string;
  fileName?: string;
  filePath?: string;
  fileData?: string;
}) {
  return viewSubmissionFile(sub);
}
