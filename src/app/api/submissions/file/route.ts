import { NextResponse } from 'next/server';
import { fetchCloudSubmissionFile, saveCloudSubmissionFile } from '@/lib/data/cloud-sync';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 });
    }

    const fileData = await fetchCloudSubmissionFile(id);
    if (!fileData) {
      return NextResponse.json({ error: 'Document file not found in cloud storage' }, { status: 404 });
    }

    return new Response(fileData, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { submissionId, fileData } = await request.json();
    if (!submissionId || !fileData) {
      return NextResponse.json({ error: 'submissionId and fileData are required' }, { status: 400 });
    }

    const success = await saveCloudSubmissionFile(submissionId, fileData);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

