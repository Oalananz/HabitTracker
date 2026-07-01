import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { getStudySessions, createStudySession, deleteStudySession } from '@/lib/services/learningService';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const skillId = searchParams.get('skillId');
    const limit = searchParams.get('limit');

    const sessions = await getStudySessions(userId, {
      courseId: courseId || undefined,
      skillId: skillId || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return NextResponse.json({ sessions });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/learning/study-sessions error:', error);
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
        const session = await createStudySession(userId, {
          courseId: body.courseId,
          skillId: body.skillId,
          title: body.title,
          durationMinutes: body.durationMinutes,
          date: body.date,
          notes: body.notes,
        });
        return NextResponse.json({ session });
      }
      case 'delete': {
        await deleteStudySession(body.sessionId, userId);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/learning/study-sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
