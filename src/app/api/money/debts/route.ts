import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import {
  getDebts,
  createDebt,
  updateDebt,
  decrementDebtRemaining,
  deleteDebt,
} from '@/lib/services/moneyService';

export async function GET() {
  try {
    const userId = await requireAuthId();
    const debts = await getDebts(userId);
    return NextResponse.json({ debts });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/money/debts error:', error);
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
        const debt = await createDebt(userId, {
          title: body.title,
          totalAmount: body.totalAmount,
          remainingAmount: body.remainingAmount,
          currency: body.currency,
          monthlyPayment: body.monthlyPayment,
          dueDate: body.dueDate,
        });
        return NextResponse.json({ debt });
      }
      case 'update': {
        const debt = await updateDebt(body.debtId, userId, {
          title: body.title,
          totalAmount: body.totalAmount,
          remainingAmount: body.remainingAmount,
          currency: body.currency,
          monthlyPayment: body.monthlyPayment,
          dueDate: body.dueDate,
          status: body.status,
        });
        return NextResponse.json({ debt });
      }
      case 'decrement': {
        const debt = await decrementDebtRemaining(body.debtId, userId, body.amount || 0);
        return NextResponse.json({ debt });
      }
      case 'delete': {
        await deleteDebt(body.debtId, userId);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/money/debts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
