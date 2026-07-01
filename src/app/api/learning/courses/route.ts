import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import {
  getLearningCourses,
  createLearningCourse,
  updateLearningCourse,
  deleteLearningCourse,
} from '@/lib/services/learningService';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const courses = await getLearningCourses(userId);
    return NextResponse.json({ courses });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/learning/courses error:', error);
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
        const course = await createLearningCourse(userId, {
          title: body.title,
          provider: body.provider,
          courseUrl: body.courseUrl,
          description: body.description,
          lifeArea: body.lifeArea,
          status: body.status,
          progressPercentage: body.progressPercentage,
          targetCompletionDate: body.targetCompletionDate,
        });
        return NextResponse.json({ course });
      }
      case 'update': {
        const course = await updateLearningCourse(body.courseId, userId, {
          title: body.title,
          provider: body.provider,
          courseUrl: body.courseUrl,
          description: body.description,
          lifeArea: body.lifeArea,
          status: body.status,
          progressPercentage: body.progressPercentage,
          targetCompletionDate: body.targetCompletionDate,
          startedAt: body.startedAt,
          completedAt: body.completedAt,
        });
        return NextResponse.json({ course });
      }
      case 'delete': {
        await deleteLearningCourse(body.courseId, userId);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/learning/courses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
