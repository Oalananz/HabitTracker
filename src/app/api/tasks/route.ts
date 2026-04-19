import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
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
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || dayjs().format('YYYY-MM-DD');

    // Auto-generate tasks for the requested date
    await generateTasksForDate(user.id, date);

    const tasks = await getTasksForDate(user.id, date);
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
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Handle different actions
    const { action } = body;

    switch (action) {
      case 'complete': {
        const task = await completeTask(body.taskId, user.id);
        return NextResponse.json({ task });
      }
      case 'uncomplete': {
        const task = await uncompleteTask(body.taskId, user.id);
        return NextResponse.json({ task });
      }
      case 'create': {
        const task = await createManualTask(user.id, {
          title: body.title,
          description: body.description,
          category: body.category,
          priority: body.priority,
          date: body.date || dayjs().format('YYYY-MM-DD'),
        });
        return NextResponse.json({ task });
      }
      case 'update': {
        const task = await updateTask(body.taskId, user.id, {
          title: body.title,
          description: body.description,
          category: body.category,
          priority: body.priority,
          date: body.date,
        });
        return NextResponse.json({ task });
      }
      case 'delete': {
        await deleteTask(body.taskId, user.id);
        return NextResponse.json({ success: true });
      }
      case 'generate': {
        const created = await generateTasksForDate(
          user.id,
          body.date || dayjs().format('YYYY-MM-DD')
        );
        return NextResponse.json({ created });
      }
      case 'generateMissing': {
        const created = await generateMissingTasks(
          user.id,
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
  }
}
