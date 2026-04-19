import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getGoals,
  createGoal,
  updateGoal,
  toggleGoalComplete,
  incrementGoalProgress,
  deleteGoal,
  getGoalsSummary,
} from '@/lib/services/goalService';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const summary = searchParams.get('summary');

    if (summary === 'true') {
      const summaryData = await getGoalsSummary(user.id);
      return NextResponse.json({ summary: summaryData });
    }

    const goals = await getGoals(user.id, type || undefined);
    return NextResponse.json({ goals });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/goals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const goal = await createGoal(user.id, {
          title: body.title,
          description: body.description,
          goalType: body.goalType,
          targetDate: body.targetDate,
          targetCount: body.targetCount,
        });
        return NextResponse.json({ goal });
      }
      case 'update': {
        const goal = await updateGoal(body.goalId, user.id, {
          title: body.title,
          description: body.description,
          goalType: body.goalType,
          targetDate: body.targetDate,
          targetCount: body.targetCount,
          currentCount: body.currentCount,
        });
        return NextResponse.json({ goal });
      }
      case 'toggle': {
        const goal = await toggleGoalComplete(body.goalId, user.id);
        return NextResponse.json({ goal });
      }
      case 'increment': {
        const goal = await incrementGoalProgress(body.goalId, user.id, body.amount || 1);
        return NextResponse.json({ goal });
      }
      case 'delete': {
        await deleteGoal(body.goalId, user.id);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/goals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
