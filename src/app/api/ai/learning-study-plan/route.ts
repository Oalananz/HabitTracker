import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';

// TODO(future): wire to Gemini via src/lib/ai/service.ts using
// sanitizeLearningDataForAi() output only — never send tokens, emails, or
// account data. For now this endpoint intentionally does not call any AI
// provider and just reports that the feature is coming soon.
export async function POST(request: NextRequest) {
  try {
    await requireAuthId();
    return NextResponse.json(
      {
        available: false,
        message: 'Coming soon: AI will generate a personalized study plan from your course progress and available time.',
      },
      { status: 200 }
    );
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/ai/learning-study-plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
