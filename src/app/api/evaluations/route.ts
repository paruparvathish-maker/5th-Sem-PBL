import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');
    const studentId = searchParams.get('student_id');

    let evals = store.getAllEvaluations();
    if (teamId) {
      evals = evals.filter((e) => e.teamId === teamId);
    }
    if (studentId) {
      evals = evals.filter((e) => e.studentId === studentId);
    }

    return NextResponse.json(evals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newEval = store.saveEvaluation(body);
    return NextResponse.json(newEval, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
