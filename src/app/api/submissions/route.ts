import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import {
  fetchCloudSubmissions,
  fetchSubmissionReset,
  isSubmissionCleared,
  saveCloudSubmission,
  saveCloudSubmissionFile,
} from '@/lib/data/cloud-sync';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');
    const deadlineId = searchParams.get('deadline_id');

    // Fetch from serverless cloud KV and merge with local store
    const [cloudSubs, submissionReset] = await Promise.all([
      fetchCloudSubmissions().catch(() => []),
      fetchSubmissionReset().catch(() => null),
    ]);
    const subMap = new Map<string, any>(
      store.getAllSubmissions().filter(s => !isSubmissionCleared(s, submissionReset)).map(s => [s.id, s])
    );
    cloudSubs.forEach(s => {
      if (s && s.id && !isSubmissionCleared(s, submissionReset)) {
        subMap.set(s.id, { ...(subMap.get(s.id) || {}), ...s });
      }
    });

    let subs = Array.from(subMap.values());
    if (teamId) {
      subs = subs.filter((s) => s.teamId === teamId);
    }
    if (deadlineId) {
      subs = subs.filter((s) => s.deadlineId === deadlineId);
    }

    return NextResponse.json(subs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = store.submitDocument(
      body.deadlineId,
      body.teamId,
      body.submittedBy || body.studentId,
      body.fileName,
      body.fileType || 'application/pdf',
      body.fileSize || 1024,
      body.fileData,
      body.remarks
    );
    if (!result.success || !result.submission) {
      return NextResponse.json({ error: result.error || 'Submission failed' }, { status: 400 });
    }

    // Persist to serverless Cloud KV
    await saveCloudSubmission(result.submission);
    if (body.fileData) {
      await saveCloudSubmissionFile(result.submission.id, body.fileData);
    }

    return NextResponse.json(result.submission, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
