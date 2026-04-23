import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import {
  getTasksForDate,
  completeTask,
  uncompleteTask,
  createManualTask,
  updateTask,
  deleteTask,
  generateTasksForDate,
  generateMissingTasks,
} from '@/lib/services/taskService';
import dayjs from 'dayjs';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || dayjs().format('YYYY-MM-DD');

    const tasks = await getTasksForDate(userId, date);
    const completed = tasks.filter((t) => t.completed).length;
    const pending = tasks.length - completed;

    return NextResponse.json({
      tasks,
      summary: {
        total: tasks.length,
        completed,
        pending,
        date,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const t0 = performance.now();
  try {
    const userId = await requireAuthId();
    const body = await request.json();

    // Handle different actions
    const { action } = body;

    switch (action) {
      case 'complete': {
        const task = await completeTask(body.taskId, userId);
        return NextResponse.json({ task });
      }
      case 'uncomplete': {
        const task = await uncompleteTask(body.taskId, userId);
        return NextResponse.json({ task });
      }
      case 'create': {
        const task = await createManualTask(userId, {
          title: body.title,
          description: body.description,
          category: body.category,
          priority: body.priority,
          date: body.date || dayjs().format('YYYY-MM-DD'),
        });
        return NextResponse.json({ task });
      }
      case 'update': {
        const task = await updateTask(body.taskId, userId, {
          title: body.title,
          description: body.description,
          category: body.category,
          priority: body.priority,
          date: body.date,
        });
        return NextResponse.json({ task });
      }
      case 'delete': {
        await deleteTask(body.taskId, userId);
        return NextResponse.json({ success: true });
      }
      case 'generate': {
        const created = await generateTasksForDate(
          userId,
          body.date || dayjs().format('YYYY-MM-DD')
        );
        return NextResponse.json({ created });
      }
      case 'generateMissing': {
        const created = await generateMissingTasks(
          userId,
          body.startDate,
          body.endDate
        );
        return NextResponse.json({ created });
      }
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/tasks error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  } finally {
    const t1 = performance.now();
    console.log(`[POST /api/tasks] took ${(t1 - t0).toFixed(2)}ms`);
  }
}
