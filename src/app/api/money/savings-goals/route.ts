import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  incrementSavingsGoal,
  deleteSavingsGoal,
} from '@/lib/services/moneyService';

export async function GET() {
  try {
    const userId = await requireAuthId();
    const savingsGoals = await getSavingsGoals(userId);
    return NextResponse.json({ savingsGoals });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/money/savings-goals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const savingsGoal = await createSavingsGoal(userId, {
          title: body.title,
          targetAmount: body.targetAmount,
          currentAmount: body.currentAmount,
          currency: body.currency,
          targetDate: body.targetDate,
        });
        return NextResponse.json({ savingsGoal });
      }
      case 'update': {
        const savingsGoal = await updateSavingsGoal(body.goalId, userId, {
          title: body.title,
          targetAmount: body.targetAmount,
          currentAmount: body.currentAmount,
          currency: body.currency,
          targetDate: body.targetDate,
          status: body.status,
        });
        return NextResponse.json({ savingsGoal });
      }
      case 'increment': {
        const savingsGoal = await incrementSavingsGoal(body.goalId, userId, body.amount || 0);
        return NextResponse.json({ savingsGoal });
      }
      case 'delete': {
        await deleteSavingsGoal(body.goalId, userId);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/money/savings-goals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
