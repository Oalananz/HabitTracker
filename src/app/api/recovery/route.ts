import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getJourneys,
  getJourney,
  createJourney,
  updateJourney,
  deleteJourney,
  recordJourneyFailure,
  resetJourney,
  getJourneyFailures,
  getRecoveryState,
} from '@/lib/services/recoveryService';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const journeyId = searchParams.get('journeyId');

    if (journeyId) {
      const journey = await getJourney(journeyId, user.id);
      const failures = await getJourneyFailures(journeyId, user.id);
      return NextResponse.json({ journey, failures });
    }

    // Return all journeys + legacy recovery state
    const journeys = await getJourneys(user.id);
    const legacyState = await getRecoveryState(user.id);
    return NextResponse.json({ journeys, recovery: legacyState });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/recovery error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'createJourney': {
        const journey = await createJourney(user.id, {
          title: body.title,
          description: body.description,
          startTime: body.startTime,
        });
        return NextResponse.json({ journey });
      }
      case 'updateJourney': {
        const journey = await updateJourney(body.journeyId, user.id, {
          title: body.title,
          description: body.description,
          startTime: body.startTime,
        });
        return NextResponse.json({ journey });
      }
      case 'deleteJourney': {
        await deleteJourney(body.journeyId, user.id);
        return NextResponse.json({ success: true });
      }
      case 'fail': {
        const result = await recordJourneyFailure(body.journeyId, user.id, body.note);
        return NextResponse.json(result);
      }
      case 'reset': {
        const journey = await resetJourney(body.journeyId, user.id, body.clearLogs || false);
        return NextResponse.json({ journey });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/recovery error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
