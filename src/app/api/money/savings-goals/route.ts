import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { errorResponse } from '@/lib/apiErrors';
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
    return errorResponse(error, 'GET /api/money/savings-goals');
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
    return errorResponse(error, 'POST /api/money/savings-goals');
  }
}
