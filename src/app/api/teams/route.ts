import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const semesterParam = searchParams.get('semester');
    const semester = semesterParam ? parseInt(semesterParam, 10) : 5;
    const section = searchParams.get('section');
    const guideId = searchParams.get('guide_id');
    const studentId = searchParams.get('student_id');
    const search = searchParams.get('search')?.toLowerCase();

    let teams = store.getAllTeams();

    // Semester filter (default 5th sem)
    if (!isNaN(semester)) {
      teams = teams.filter((t) => (t.semester || 5) === semester);
    }

    // Section filter
    if (section && section !== 'ALL') {
      teams = teams.filter((t) => t.section.toUpperCase() === section.toUpperCase());
    }

    // Guide filter
    if (guideId) {
      teams = teams.filter((t) => t.guideId === guideId);
    }

    // Student member filter
    if (studentId) {
      const q = studentId.toLowerCase();
      teams = teams.filter((t) =>
        t.members?.some(
          (m) => m.id.toLowerCase() === q || (m.usn && m.usn.toLowerCase() === q)
        )
      );
    }

    // Search filter
    if (search) {
      teams = teams.filter(
        (t) =>
          t.teamNumber.toLowerCase().includes(search) ||
          t.projectTitle.toLowerCase().includes(search) ||
          (t.guideName && t.guideName.toLowerCase().includes(search)) ||
          t.members?.some(
            (m) =>
              m.name.toLowerCase().includes(search) ||
              (m.usn && m.usn.toLowerCase().includes(search))
          )
      );
    }

    return NextResponse.json(teams);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
