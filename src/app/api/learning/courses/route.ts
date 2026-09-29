import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { errorResponse } from '@/lib/apiErrors';
import {
  getLearningCourses,
  createLearningCourse,
  updateLearningCourse,
  deleteLearningCourse,
} from '@/lib/services/learningService';

export async function GET() {
  try {
    const userId = await requireAuthId();
    const courses = await getLearningCourses(userId);
    return NextResponse.json({ courses });
  } catch (error) {
    return errorResponse(error, 'GET /api/learning/courses');
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
    return errorResponse(error, 'POST /api/learning/courses');
  }
}
