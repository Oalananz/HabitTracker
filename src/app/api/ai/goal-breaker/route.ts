import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { GoalBreakerInputSchema } from '@/lib/ai/schemas';
import { breakGoalIntoPlan } from '@/lib/ai/service';
import { aiErrorResponse, rateLimitGuard } from '@/lib/ai/handler';
import { DAY_MS } from '@/lib/ai/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuthId();

    const limited = rateLimitGuard(userId, 'goal-breaker', 20, DAY_MS);
    if (limited) return limited;

    const parsed = GoalBreakerInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request. A goal title is required.' }, { status: 400 });
    }

    const breakdown = await breakGoalIntoPlan(parsed.data);
    return NextResponse.json({ breakdown });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
