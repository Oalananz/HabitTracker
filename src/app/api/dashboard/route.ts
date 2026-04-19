import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { calculateMetrics } from '@/lib/services/dashboardService';

export async function GET() {
  try {
    const user = await requireAuth();
    const metrics = await calculateMetrics(user.id);
    return NextResponse.json({ metrics });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
