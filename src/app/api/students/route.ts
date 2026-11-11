import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    const search = searchParams.get('search')?.toLowerCase();

    let students = store.getStudents();

    if (section && section !== 'ALL') {
      students = students.filter((s) => s.section?.toUpperCase() === section.toUpperCase());
    }

    if (search) {
      students = students.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          (s.usn && s.usn.toLowerCase().includes(search)) ||
          s.email.toLowerCase().includes(search)
      );
    }

    const sanitizedStudents = students.map(({ password, ...rest }) => ({
      ...rest,
      password: password ? '••••••••' : undefined,
      hasPassword: !!password
    }));

    return NextResponse.json(sanitizedStudents);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

