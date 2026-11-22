import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { getAppOrigin } from '@/lib/utils/mailer';
import { buildReviewPreview, notifyReviewSubmission } from '@/lib/notifications/review-reminders';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const LAST_SEND = new Map<string, number>();
const COOLDOWN_MS = 90 * 1000;

function isPrivileged(userId?: string, role?: string): boolean {
  if (!userId || !role) return false;
  if (role !== 'admin' && role !== 'faculty') return false;
  const profile = store.getAllProfiles().find((p) => p.id === userId);
  return Boolean(profile && profile.role === role);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const preview = await buildReviewPreview(
      searchParams.get('deadlineId') || undefined,
      searchParams.get('title') || undefined
    );
    return NextResponse.json({
      deadlineId: preview.review.deadline.id,
      deadlineTitle: preview.review.deadline.title,
      reviewNumber: preview.review.reviewNumber,
      maxMarks: preview.review.maxMarks,
      pendingTeams: preview.pendingTeams.length,
      submittedTeams: preview.submittedTeams.length,
      pendingStudentsWithAccount: preview.pendingTeams.reduce((sum, t) => sum + t.studentEmails.length, 0),
      facultyToNotify: new Set(
        [...preview.pendingTeams, ...preview.submittedTeams]
          .map((t) => (t.guideEmail || '').toLowerCase())
          .filter((e) => e.includes('@'))
      ).size,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not build the reminder preview.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!isPrivileged(body.userId, body.role)) {
      return NextResponse.json({ error: 'Not authorised to send review notifications.' }, { status: 403 });
    }

    const dryRun = body.dryRun === true;
    const deadlineId = body.deadlineId || undefined;

    if (!dryRun) {
      const key = deadlineId || 'default';
      const last = LAST_SEND.get(key) || 0;
      if (Date.now() - last < COOLDOWN_MS) {
        return NextResponse.json(
          { error: 'Reminders for this milestone were sent moments ago. Please wait a couple of minutes before sending again.' },
          { status: 429 }
        );
      }
      LAST_SEND.set(key, Date.now());
    }

    // Links must always point at the public portal, even when the campaign is
    // triggered from a local preview server.
    const requestedOrigin = typeof body.origin === 'string' ? body.origin.replace(/\/$/, '') : '';
    const origin = /^https:\/\/[^\s]+$/i.test(requestedOrigin) ? requestedOrigin : getAppOrigin(request);

    const result = await notifyReviewSubmission(origin, {
      deadlineId,
      titleHint: body.titleHint,
      includeStudents: body.includeStudents !== false,
      includeFaculty: body.includeFaculty !== false,
      dryRun,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to send review notifications.' }, { status: 500 });
  }
}
