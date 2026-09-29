import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { errorResponse } from '@/lib/apiErrors';
import {
  getLearningResources,
  createLearningResource,
  updateLearningResource,
  deleteLearningResource,
} from '@/lib/services/learningService';

export async function GET() {
  try {
    const userId = await requireAuthId();
    const resources = await getLearningResources(userId);
    return NextResponse.json({ resources });
  } catch (error) {
    return errorResponse(error, 'GET /api/learning/resources');
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const resource = await createLearningResource(userId, {
          title: body.title,
          url: body.url,
          type: body.type,
          provider: body.provider,
          status: body.status,
        });
        return NextResponse.json({ resource });
      }
      case 'update': {
        const resource = await updateLearningResource(body.resourceId, userId, {
          title: body.title,
          url: body.url,
          type: body.type,
          provider: body.provider,
          status: body.status,
        });
        return NextResponse.json({ resource });
      }
      case 'delete': {
        await deleteLearningResource(body.resourceId, userId);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return errorResponse(error, 'POST /api/learning/resources');
  }
}
