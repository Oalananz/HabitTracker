import { NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { leaveJourney } from '@/lib/services/competitiveJourneyService';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuthId();
    const { id } = await params;
    const result = await leaveJourney(id, userId);
    return NextResponse.json(result);
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 400 }
    );
  }
}
