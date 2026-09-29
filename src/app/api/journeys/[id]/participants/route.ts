import { NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { getJourneyParticipants } from '@/lib/services/competitiveJourneyService';
import { errorResponse } from '@/lib/apiErrors';

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
    return errorResponse(error, 'GET /api/journeys/[id]/participants');
  }
}
