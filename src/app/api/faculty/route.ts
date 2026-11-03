import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();

    let faculty = store.getFaculty();
    const teams = store.getAllTeams();

    if (search) {
      faculty = faculty.filter(
        (f) =>
          f.name.toLowerCase().includes(search) ||
          f.email.toLowerCase().includes(search)
      );
    }

    const result = faculty.map((f) => {
      const assigned5thSem = teams.filter(
        (t) => t.guideId === f.id && (t.semester || 5) === 5
      );
      return {
        ...f,
        assignedTeamsCount: assigned5thSem.length,
        assigned5thSemProjects: assigned5thSem.map((t) => ({
          teamId: t.id,
          teamNumber: t.teamNumber,
          section: t.section,
          projectTitle: t.projectTitle,
        })),
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

