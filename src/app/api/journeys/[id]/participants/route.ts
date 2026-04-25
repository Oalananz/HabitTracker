import { NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { getJourneyParticipants } from '@/lib/services/competitiveJourneyService';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuthId();
    const { id } = await params;
    const participants = await getJourneyParticipants(id, userId);
    return NextResponse.json({ participants });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const message = (error as Error).message || 'Internal server error';
    const status = message.includes('access') ? 403 : message.includes('not found') ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
