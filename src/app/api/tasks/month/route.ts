import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { requireAuthId } from '@/lib/auth';
import { getTaskSummaryForRange } from '@/lib/services/taskService';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month') || dayjs().format('YYYY-MM');

    const monthStart = dayjs(`${monthParam}-01`, 'YYYY-MM-DD', true);
    if (!monthStart.isValid()) {
      return NextResponse.json({ error: 'Invalid month. Expected YYYY-MM.' }, { status: 400 });
    }

    const startDate = monthStart.startOf('month').format('YYYY-MM-DD');
    const endDate = monthStart.endOf('month').format('YYYY-MM-DD');

    const summary = await getTaskSummaryForRange(userId, startDate, endDate);

    return NextResponse.json({
      month: monthStart.format('YYYY-MM'),
      startDate,
      endDate,
      summary,
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/tasks/month error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
