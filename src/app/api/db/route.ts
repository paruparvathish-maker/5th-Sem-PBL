import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'local-db.json');

export async function GET() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      return NextResponse.json(JSON.parse(data));
    }
    return NextResponse.json({ error: 'No database found' }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read database' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to write database' }, { status: 500 });
  }
}
