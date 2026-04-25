import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import {
  addJourneyConsequence,
  addJourneyReaction,
  deleteJourney,
  getJourneyDetails,
  inviteUser,
  recordJourneyCheckIn,
  updateJourney,
} from '@/lib/services/competitiveJourneyService';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const t0 = performance.now();
  try {
    const userId = await requireAuthId();
    const { id } = await params;
    const journey = await getJourneyDetails(id, userId);
    return NextResponse.json(journey);
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = (error as Error).message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: (error as Error).message || 'Internal server error' }, { status });
  } finally {
    const t1 = performance.now();
    console.log(`[GET /api/journeys/[id]] took ${(t1 - t0).toFixed(2)}ms`);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuthId();
    const { id } = await params;
    const body = await request.json();

    switch (body.action) {
      case 'invite': {
        const invite = await inviteUser(id, userId, {
          username: body.username,
          email: body.email,
        });
        return NextResponse.json({ invite });
      }
      case 'addConsequence': {
        const consequence = await addJourneyConsequence(id, userId, {
          failureThreshold: Number(body.failureThreshold),
          description: body.description,
          consequenceType: body.consequenceType,
          symbol: body.symbol,
        });
        return NextResponse.json({ consequence });
      }
      case 'encourage': {
        const reaction = await addJourneyReaction(id, userId, {
          toUserId: body.toUserId,
          emoji: body.emoji,
          message: body.message,
        });
        return NextResponse.json({ reaction });
      }
      case 'checkIn': {
        const checkIn = await recordJourneyCheckIn(id, userId, body.note);
        return NextResponse.json({ checkIn });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const message = (error as Error).message || 'Internal server error';
    const status =
      message.includes('not found')
        ? 404
        : message.includes('must') || message.includes('Only') || message.includes('required')
          ? 400
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuthId();
    const { id } = await params;

    await deleteJourney(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const message = (error as Error).message || 'Internal server error';
    const status =
      message.includes('not found')
        ? 404
        : message.includes('must') || message.includes('Only') || message.includes('required')
          ? 400
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuthId();
    const { id } = await params;
    const body = await request.json();

    await updateJourney(id, userId, {
      name: body.name,
      description: body.description,
      rulesText: body.rulesText,
      consequenceRules: body.consequenceRules,
      rules: body.rules,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const message = (error as Error).message || 'Internal server error';
    const status =
      message.includes('not found')
        ? 404
        : message.includes('must') || message.includes('Only') || message.includes('required')
          ? 400
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
