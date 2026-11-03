import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    let deadlines = store.getAllDeadlines();
    if (section && section !== 'ALL') {
      deadlines = deadlines.filter(
        (d) =>
          !d.applicableSections ||
          d.applicableSections.includes(section.toUpperCase() as any)
      );
    }

    return NextResponse.json(deadlines);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

