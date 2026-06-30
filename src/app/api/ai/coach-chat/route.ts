import { NextResponse } from 'next/server';

// Placeholder for the future AI Coach Chat. It intentionally does NOT call
// Gemini yet — chat will only be wired up once it has its own privacy filters
// and streaming backend. Until then it returns a disabled-state message.
export async function POST() {
  return NextResponse.json({ message: 'AI Coach Chat is not enabled yet.' }, { status: 501 });
}

export async function GET() {
  return NextResponse.json({ message: 'AI Coach Chat is not enabled yet.' }, { status: 501 });
}
