import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import {
  getMoneyTransactions,
  createMoneyTransaction,
  updateMoneyTransaction,
  deleteMoneyTransaction,
} from '@/lib/services/moneyService';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const { searchParams } = new URL(request.url);

    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const transactions = await getMoneyTransactions(userId, {
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      type: searchParams.get('type') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      paymentMethod: searchParams.get('paymentMethod') || undefined,
      currency: searchParams.get('currency') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/money/transactions error:', error);
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
        const transaction = await createMoneyTransaction(userId, {
          type: body.type,
          amount: body.amount,
          currency: body.currency,
          categoryId: body.categoryId,
          title: body.title,
          description: body.description,
          date: body.date,
          paymentMethod: body.paymentMethod,
          lifeArea: body.lifeArea,
          isRecurring: body.isRecurring,
          recurringRule: body.recurringRule,
        });
        return NextResponse.json({ transaction });
      }
      case 'update': {
        const transaction = await updateMoneyTransaction(body.transactionId, userId, {
          type: body.type,
          amount: body.amount,
          currency: body.currency,
          categoryId: body.categoryId,
          title: body.title,
          description: body.description,
          date: body.date,
          paymentMethod: body.paymentMethod,
          lifeArea: body.lifeArea,
          isRecurring: body.isRecurring,
          recurringRule: body.recurringRule,
        });
        return NextResponse.json({ transaction });
      }
      case 'delete': {
        await deleteMoneyTransaction(body.transactionId, userId);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/money/transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
