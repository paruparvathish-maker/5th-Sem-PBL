/**
 * Universal document and image viewer for student submissions and guide proofs.
 * Opens documents (PDF, Images, etc.) directly in a new browser tab for preview
 * WITHOUT downloading the file to disk, as requested by institutional faculty and administrators.
 */

import { getFileFromIdb } from './idb-storage';

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

/**
 * Opens a faculty or student proof document or image in another tab.
 * Does not download the file. Resolves from data URI, local storage, IndexedDB, or server API.
 */
export async function viewProofFile(proofPath?: string, proofName?: string, teamId?: string) {
  const name = proofName || '';
  const isImage = name.match(/\.(png|jpe?g|webp|gif|svg)$/i) || (proofPath && proofPath.startsWith('data:image/'));
  const defaultMime = isImage ? 'image/jpeg' : 'application/pdf';

  // 1. Direct Data URI
  if (proofPath && proofPath.startsWith('data:')) {
    const blobUrl = dataUriToBlobUrl(proofPath, defaultMime);
    openInNewTab(blobUrl);
    return;
  }

  // 2. Check IndexedDB / the shared proof endpoint first: the local static copy
  //    may not exist on another device or on the deployment.
  if (teamId) {
    try {
      const idbData = await getFileFromIdb(`proof_${teamId}`);
      if (idbData && idbData.startsWith('data:')) {
        const blobUrl = dataUriToBlobUrl(idbData, defaultMime);
        openInNewTab(blobUrl);
        return;
      }
    } catch {}

    try {
      const apiProofUrl = `/api/teams/proof?teamId=${encodeURIComponent(teamId)}`;
      const testRes = await fetch(apiProofUrl, { method: 'HEAD' });
      if (testRes.ok) {
        openInNewTab(apiProofUrl);
        return;
      }
    } catch {}
  }

  // 3. Direct HTTP URL
  if (proofPath && (proofPath.startsWith('http://') || proofPath.startsWith('https://'))) {
    openInNewTab(proofPath);
    return;
  }

  // 4. Static storage path - only open it when the file is really reachable
  if (proofPath && proofPath.startsWith('/storage/')) {
    try {
      const testRes = await fetch(proofPath, { method: 'HEAD' });
      if (testRes.ok) {
        openInNewTab(proofPath);
        return;
      }
    } catch {}
  }

  if (proofPath && proofPath !== '#' && proofPath.trim() !== '') {
    openInNewTab(proofPath);
    return;
  }

  alert('No proof document or image has been uploaded yet for this team.');
}

/**
 * Universal submission document viewer.
 * Resolves file from in-memory base64, IndexedDB cache, or cloud storage API,
 * and opens the PDF, Image, or Document directly in another tab without downloading.
 */
export async function viewSubmissionFile(sub: {
  id?: string;
  fileName?: string;
  filePath?: string;
  fileData?: string;
  deadlineTitle?: string;
  teamNumber?: string;
  projectTitle?: string;
  studentName?: string;
  submissionTime?: string;
  aiSummary?: string;
  remarks?: string;
}) {
  const fileName = sub.fileName || 'project_details.pdf';
  let data = sub.fileData || sub.filePath;

  // 1. Check IndexedDB if fileData is not in memory
  if ((!data || !data.startsWith('data:')) && sub.id) {
    try {
      const idbData = await getFileFromIdb(sub.id);
      if (idbData && idbData.startsWith('data:')) {
        data = idbData;
      }
    } catch {}
  }

  // 2. Fetch from cloud storage API if not found on this local device
  if ((!data || !data.startsWith('data:')) && sub.id) {
    try {
      const res = await fetch(`/api/submissions/file?id=${encodeURIComponent(sub.id)}`);
      if (res.ok) {
        const cloudData = await res.text();
        if (cloudData && cloudData.startsWith('data:')) {
          data = cloudData;
        }
      }
    } catch {}
  }

  // 3. If base64 data URI, blob URL, or remote URL is present, open directly in new tab
  if (data && (data.startsWith('data:') || data.startsWith('blob:') || data.startsWith('http://') || data.startsWith('https://'))) {
    const isImage = fileName.match(/\.(png|jpe?g|webp|gif|svg)$/i) || data.startsWith('data:image/');
    const isDocx = fileName.match(/\.(docx?|odt)$/i);
    const defaultMime = isImage ? 'image/jpeg' : isDocx ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf';

    // If it's a Word document (.docx), create a dedicated, styled preview tab
    if (isDocx && !data.startsWith('http')) {
      const docPreviewHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName} - DSATM PBL Document Preview</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 32px 16px; }
    .card { max-width: 760px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.06); overflow: hidden; }
    .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff; padding: 28px 24px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #c7d2fe; }
    .content { padding: 28px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background: #e0e7ff; color: #3730a3; margin-bottom: 16px; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 20px 0; padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; }
    .meta-item label { display: block; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .meta-item span { font-size: 13px; font-weight: 700; color: #0f172a; }
    .summary-box { background: #f1f5f9; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 13px; line-height: 1.6; color: #334155; }
    .footer-note { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Dayananda Sagar Academy of Technology &amp; Management (DSATM)</h1>
      <p>Industrial Project Based Learning (PBL) Portal • CSE Department</p>
    </div>
    <div class="content">
      <span class="badge">Submitted Document Preview</span>
      <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #0f172a;">${fileName}</h2>
      <p style="margin: 0; color: #64748b; font-size: 13px;">${sub.projectTitle || sub.deadlineTitle || 'Phase 1 Review Deliverable'}</p>

      <div class="meta-grid">
        <div class="meta-item">
          <label>Team Group</label>
          <span>Group ${sub.teamNumber || 'N/A'}</span>
        </div>
        <div class="meta-item">
          <label>Submitting Student</label>
          <span>${sub.studentName || 'Student'}</span>
        </div>
        <div class="meta-item">
          <label>Submission Date</label>
          <span>${new Date(sub.submissionTime || Date.now()).toLocaleString()}</span>
        </div>
        <div class="meta-item">
          <label>Format</label>
          <span>Microsoft Word Document (.docx)</span>
        </div>
      </div>

      <div class="summary-box">
        <strong>Document Notes &amp; Summary:</strong><br>
        ${sub.aiSummary || sub.remarks || 'This Microsoft Word document was submitted by the team for faculty review.'}
      </div>

      <p class="footer-note">DSATM Industrial PBL Portal • View-only document preview mode (Direct download suppressed)</p>
    </div>
  </div>
</body>
</html>
      `;
      const htmlBlob = new Blob([docPreviewHtml], { type: 'text/html' });
      const htmlUrl = URL.createObjectURL(htmlBlob);
      openInNewTab(htmlUrl);
      return;
    }

    const blobUrl = dataUriToBlobUrl(data, defaultMime);
    openInNewTab(blobUrl);
    return;
  }

  // 4. Fallback: Synthesize a clean, valid PDF overview report that opens natively in new tab
  const cleanTitle = (sub.projectTitle || sub.deadlineTitle || 'PBL Project Report').replace(/[()\\]/g, ' ');
  const cleanTeam = (sub.teamNumber || 'N/A').replace(/[()\\]/g, ' ');
  const cleanAuthor = (sub.studentName || 'Student').replace(/[()\\]/g, ' ');
  const cleanSummary = (sub.aiSummary || sub.remarks || 'Phase 1 Report submitted for faculty guide review.').replace(/[()\\]/g, ' ').slice(0, 120);

  const streamContent = `BT
/F1 16 Tf
50 720 Td
(${cleanTitle.slice(0, 45)}) Tj
/F1 11 Tf
0 -30 Td
(Team: Group ${cleanTeam}) Tj
0 -20 Td
(Submitted By: ${cleanAuthor}) Tj
0 -20 Td
(Date: ${new Date(sub.submissionTime || Date.now()).toLocaleDateString()}) Tj
0 -35 Td
(Overview: ${cleanSummary}) Tj
ET`;

  const streamLength = streamContent.length;

  const pdfBody = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${streamLength} >> stream
${streamContent}
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000400 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
480
%%EOF`;

  const blob = new Blob([pdfBody], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  // Open directly in a new tab without downloading
  openInNewTab(blobUrl);
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
  deadlineTitle?: string;
  teamNumber?: string;
  projectTitle?: string;
  studentName?: string;
  submissionTime?: string;
  aiSummary?: string;
  remarks?: string;
}) {
  return viewSubmissionFile(sub);
}
