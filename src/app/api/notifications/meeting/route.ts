import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { getAppOrigin } from '@/lib/utils/mailer';
import { notifyTeamMeeting } from '@/lib/notifications/review-reminders';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isFacultyOrAdmin(userId?: string, role?: string): boolean {
  if (!userId || !role) return false;
  if (role !== 'faculty' && role !== 'admin') return false;
  const profile = store.getAllProfiles().find((p) => p.id === userId);
  return Boolean(profile && profile.role === role);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!isFacultyOrAdmin(body.userId || body.facultyId, body.role)) {
      return NextResponse.json({ error: 'Only the faculty guide or an administrator can notify a team.' }, { status: 403 });
    }
    if (!body.teamId || !body.title || !body.meetingDate) {
      return NextResponse.json({ error: 'Team, meeting title and date are required.' }, { status: 400 });
    }

    const team = store.getAllTeams().find((t) => t.id === body.teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }

    const result = await notifyTeamMeeting(getAppOrigin(request), {
      teamId: body.teamId,
      title: String(body.title),
      meetingDate: String(body.meetingDate),
      location: String(body.location || ''),
      agenda: body.agenda ? String(body.agenda) : undefined,
      facultyName: body.facultyName ? String(body.facultyName) : team.guideName,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to notify the team.' }, { status: 500 });
  }
}
