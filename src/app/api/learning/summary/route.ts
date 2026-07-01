import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { getLearningSummary } from '@/lib/services/learningService';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const summary = await getLearningSummary(userId);
    return NextResponse.json({ summary });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/learning/summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
