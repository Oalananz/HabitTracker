import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from '@/lib/services/moneyService';

export async function GET() {
  try {
    const userId = await requireAuthId();
    const subscriptions = await getSubscriptions(userId);
    return NextResponse.json({ subscriptions });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/money/subscriptions error:', error);
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
        const subscription = await createSubscription(userId, {
          title: body.title,
          amount: body.amount,
          currency: body.currency,
          billingCycle: body.billingCycle,
          nextBillingDate: body.nextBillingDate,
          categoryId: body.categoryId,
          isActive: body.isActive,
        });
        return NextResponse.json({ subscription });
      }
      case 'update': {
        const subscription = await updateSubscription(body.subscriptionId, userId, {
          title: body.title,
          amount: body.amount,
          currency: body.currency,
          billingCycle: body.billingCycle,
          nextBillingDate: body.nextBillingDate,
          categoryId: body.categoryId,
          isActive: body.isActive,
        });
        return NextResponse.json({ subscription });
      }
      case 'delete': {
        await deleteSubscription(body.subscriptionId, userId);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/money/subscriptions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
