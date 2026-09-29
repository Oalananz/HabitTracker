import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { errorResponse } from '@/lib/apiErrors';
import {
  getLearningProviders,
  getConnectedAccounts,
  disconnectAccount,
  createManualCourseLink,
} from '@/lib/services/learningConnectionsService';

export async function GET() {
  try {
    const userId = await requireAuthId();
    const [providers, connectedAccounts] = await Promise.all([
      getLearningProviders(),
      getConnectedAccounts(userId),
    ]);
    return NextResponse.json({ providers, connectedAccounts });
  } catch (error) {
    return errorResponse(error, 'GET /api/learning/connections');
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'manual-link': {
        const course = await createManualCourseLink(userId, {
          title: body.title,
          courseUrl: body.courseUrl,
          provider: body.provider,
          progressPercentage: body.progressPercentage,
          targetCompletionDate: body.targetCompletionDate,
        });
        return NextResponse.json({ course });
      }
      case 'disconnect': {
        await disconnectAccount(body.accountId, userId);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return errorResponse(error, 'POST /api/learning/connections');
  }
}
