import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');
    const deadlineId = searchParams.get('deadline_id');

    let subs = store.getAllSubmissions();
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
      body.fileSize || 1024
    );
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.submission, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
