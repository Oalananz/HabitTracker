import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { WeeklyReviewInputSchema } from '@/lib/ai/schemas';
import { generateWeeklyReview } from '@/lib/ai/service';
import { aiErrorResponse, rateLimitGuard } from '@/lib/ai/handler';
import { WEEK_MS } from '@/lib/ai/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuthId();

    const limited = rateLimitGuard(userId, 'weekly-review', 10, WEEK_MS);
    if (limited) return limited;

    const parsed = WeeklyReviewInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const review = await generateWeeklyReview(parsed.data);
    return NextResponse.json({ review });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
