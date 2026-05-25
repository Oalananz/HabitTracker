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
    console.error('GET /api/journeys/[id]/participants error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
