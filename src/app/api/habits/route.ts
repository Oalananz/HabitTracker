import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { errorResponse } from '@/lib/apiErrors';
import {
  createHabit,
  updateHabit,
  deactivateHabit,
  activateHabit,
  getHabits,
  deleteHabit,
} from '@/lib/services/habitService';

export async function GET() {
  try {
    const userId = await requireAuthId();
    const habits = await getHabits(userId);
    return NextResponse.json({ habits });
  } catch (error) {
    return errorResponse(error, 'GET /api/habits');
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
          lifeArea: body.lifeArea,
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
          lifeArea: body.lifeArea,
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
    return errorResponse(error, 'POST /api/habits');
  }
}
