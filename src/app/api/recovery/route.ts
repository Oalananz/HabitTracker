import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
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
  const t0 = performance.now();
  try {
    const userId = await requireAuthId();
    const { searchParams } = new URL(request.url);
    const journeyId = searchParams.get('journeyId');

    if (journeyId) {
      const journey = await getJourney(journeyId, userId);
      const failures = await getJourneyFailures(journeyId, userId);
      return NextResponse.json({ journey, failures });
    }

    // Return all journeys + legacy recovery state
    const [journeys, legacyState] = await Promise.all([
      getJourneys(userId),
      getRecoveryState(userId),
    ]);
    return NextResponse.json({ journeys, recovery: legacyState });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/recovery error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    const t1 = performance.now();
    console.log(`[GET /api/recovery] took ${(t1 - t0).toFixed(2)}ms`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'createJourney': {
        const journey = await createJourney(userId, {
          title: body.title,
          description: body.description,
          startTime: body.startTime,
        });
        return NextResponse.json({ journey });
      }
      case 'updateJourney': {
        const journey = await updateJourney(body.journeyId, userId, {
          title: body.title,
          description: body.description,
          startTime: body.startTime,
        });
        return NextResponse.json({ journey });
      }
      case 'deleteJourney': {
        await deleteJourney(body.journeyId, userId);
        return NextResponse.json({ success: true });
      }
      case 'fail': {
        const result = await recordJourneyFailure(body.journeyId, userId, body.note);
        return NextResponse.json(result);
      }
      case 'reset': {
        const journey = await resetJourney(body.journeyId, userId, body.clearLogs || false);
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
