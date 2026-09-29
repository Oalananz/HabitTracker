import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { errorResponse } from '@/lib/apiErrors';
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
    const userId = await requireAuthId();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const summary = searchParams.get('summary');

    if (summary === 'true') {
      const summaryData = await getGoalsSummary(userId);
      return NextResponse.json({ summary: summaryData });
    }

    const goals = await getGoals(userId, type || undefined);
    return NextResponse.json({ goals });
  } catch (error) {
    return errorResponse(error, 'GET /api/goals');
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const goal = await createGoal(userId, {
          title: body.title,
          description: body.description,
          goalType: body.goalType,
          targetDate: body.targetDate,
          targetCount: body.targetCount,
          lifeArea: body.lifeArea,
        });
        return NextResponse.json({ goal });
      }
      case 'update': {
        const goal = await updateGoal(body.goalId, userId, {
          title: body.title,
          description: body.description,
          goalType: body.goalType,
          targetDate: body.targetDate,
          targetCount: body.targetCount,
          currentCount: body.currentCount,
          lifeArea: body.lifeArea,
          isActive: body.isActive,
        });
        return NextResponse.json({ goal });
      }
      case 'toggle': {
        const goal = await toggleGoalComplete(body.goalId, userId);
        return NextResponse.json({ goal });
      }
      case 'increment': {
        const goal = await incrementGoalProgress(body.goalId, userId, body.amount || 1);
        return NextResponse.json({ goal });
      }
      case 'delete': {
        await deleteGoal(body.goalId, userId);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return errorResponse(error, 'POST /api/goals');
  }
}
