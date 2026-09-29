import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { errorResponse } from '@/lib/apiErrors';
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
    return errorResponse(error, 'GET /api/money/budgets');
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
    return errorResponse(error, 'POST /api/money/budgets');
  }
}
