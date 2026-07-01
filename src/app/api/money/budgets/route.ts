import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import {
  getMoneyBudgets,
  createMoneyBudget,
  updateMoneyBudget,
  deleteMoneyBudget,
} from '@/lib/services/moneyService';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const budgets = await getMoneyBudgets(
      userId,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined
    );
    return NextResponse.json({ budgets });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/money/budgets error:', error);
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
        const budget = await createMoneyBudget(userId, {
          month: body.month,
          year: body.year,
          categoryId: body.categoryId,
          amount: body.amount,
          currency: body.currency,
        });
        return NextResponse.json({ budget });
      }
      case 'update': {
        const budget = await updateMoneyBudget(body.budgetId, userId, {
          month: body.month,
          year: body.year,
          categoryId: body.categoryId,
          amount: body.amount,
          currency: body.currency,
        });
        return NextResponse.json({ budget });
      }
      case 'delete': {
        await deleteMoneyBudget(body.budgetId, userId);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/money/budgets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
