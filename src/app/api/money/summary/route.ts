import { NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { getMoneySummary } from '@/lib/services/moneyService';

export async function GET() {
  try {
    const userId = await requireAuthId();
    const summary = await getMoneySummary(userId);
    return NextResponse.json({ summary });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/money/summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
