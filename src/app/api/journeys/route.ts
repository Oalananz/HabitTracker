import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import {
  createJourney,
  getJourneyCatalog,
} from '@/lib/services/competitiveJourneyService';

export async function GET() {
  const t0 = performance.now();
  try {
    const userId = await requireAuthId();
    const data = await getJourneyCatalog(userId);
    return NextResponse.json(data);
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('GET /api/journeys error:', error);
    return NextResponse.json({ error: (error as Error).message || 'Internal server error' }, { status: 500 });
  } finally {
    const t1 = performance.now();
    console.log(`[GET /api/journeys] took ${(t1 - t0).toFixed(2)}ms`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const body = await request.json();

    if (body.action && body.action !== 'create') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const journey = await createJourney(userId, {
      name: body.name,
      description: body.description,
      startDate: body.startDate,
      endDate: body.endDate,
      rulesText: body.rulesText,
      rules: body.rules,
      maxFailures: body.maxFailures,
      consequenceRules: body.consequenceRules,
      visibility: body.visibility,
      consequences: body.consequences,
    });

    return NextResponse.json({ journey }, { status: 201 });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: (error as Error).message || 'Internal server error' }, { status: 500 });
  }
}
