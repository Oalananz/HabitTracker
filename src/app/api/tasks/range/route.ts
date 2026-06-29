import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { getTasksForRange } from '@/lib/services/taskService';
import dayjs from 'dayjs';

// GET /api/tasks/range?start=YYYY-MM-DD&end=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start') || dayjs().startOf('week').format('YYYY-MM-DD');
    const end = searchParams.get('end') || dayjs().endOf('week').format('YYYY-MM-DD');

    const tasks = await getTasksForRange(userId, start, end);
    return NextResponse.json({ tasks });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/tasks/range error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
