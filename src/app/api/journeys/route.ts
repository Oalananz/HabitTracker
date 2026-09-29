import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { errorResponse } from '@/lib/apiErrors';
import {
  createJourney,
  getJourneyCatalog,
} from '@/lib/services/competitiveJourneyService';

export async function GET() {
  try {
    const userId = await requireAuthId();
    const data = await getJourneyCatalog(userId);
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error, 'GET /api/journeys');
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
    return errorResponse(error, 'POST /api/journeys');
  }
}
