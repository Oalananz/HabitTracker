import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import {
  getLearningProviders,
  getConnectedAccounts,
  disconnectAccount,
  createManualCourseLink,
} from '@/lib/services/learningConnectionsService';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const [providers, connectedAccounts] = await Promise.all([
      getLearningProviders(),
      getConnectedAccounts(userId),
    ]);
    return NextResponse.json({ providers, connectedAccounts });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/learning/connections error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/learning/connections error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
