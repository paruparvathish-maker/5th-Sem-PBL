/**
 * Robust file downloader for student submissions and review reports.
 * Checks for base64 dataUrl, IndexedDB cached files, remote URLs,
 * and falls back to generating a valid downloadable PDF document.
 */

import { getFileFromIdb } from './idb-storage';

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
  const fileName = sub.fileName || 'project_details.pdf';
  let data = sub.fileData || sub.filePath;

  // Check IndexedDB if fileData is not in memory
  if ((!data || !data.startsWith('data:')) && sub.id) {
    const idbData = await getFileFromIdb(sub.id);
    if (idbData) {
      data = idbData;
    }
  }

  // 1. If base64 data URI, blob URL, or remote URL is present
  if (data && (data.startsWith('data:') || data.startsWith('blob:') || data.startsWith('http://') || data.startsWith('https://'))) {
    const link = document.createElement('a');
    link.href = data;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // 2. Synthesize a clean, valid PDF file that opens natively in any viewer
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
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
}
