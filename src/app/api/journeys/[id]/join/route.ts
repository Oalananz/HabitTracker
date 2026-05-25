import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { joinJourney } from '@/lib/services/competitiveJourneyService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuthId();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const result = await joinJourney(id, userId, {
      token: body.token,
      decision: body.decision,
    });

    return NextResponse.json(result);
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/journeys/[id]/join error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
  }
}
