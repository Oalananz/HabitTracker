import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import {
  createHabit,
  updateHabit,
  deactivateHabit,
  activateHabit,
  getHabits,
  deleteHabit,
} from '@/lib/services/habitService';

export async function GET() {
  const t0 = performance.now();
  try {
    const userId = await requireAuthId();
    const habits = await getHabits(userId);
    return NextResponse.json({ habits });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/habits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    const t1 = performance.now();
    console.log(`[GET /api/habits] took ${(t1 - t0).toFixed(2)}ms`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const habit = await createHabit(userId, {
          title: body.title,
          description: body.description,
          category: body.category,
          priority: body.priority,
          repeatRule: body.repeatRule,
        });
        return NextResponse.json({ habit });
      }
      case 'update': {
        const habit = await updateHabit(body.habitId, userId, {
          title: body.title,
          description: body.description,
          category: body.category,
          priority: body.priority,
          repeatRule: body.repeatRule,
        });
        return NextResponse.json({ habit });
      }
      case 'deactivate': {
        const habit = await deactivateHabit(body.habitId, userId);
        return NextResponse.json({ habit });
      }
      case 'activate': {
        const habit = await activateHabit(body.habitId, userId);
        return NextResponse.json({ habit });
      }
      case 'delete': {
        await deleteHabit(body.habitId, userId);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/habits error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}
