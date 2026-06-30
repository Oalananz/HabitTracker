import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { DailyPlannerInputSchema } from '@/lib/ai/schemas';
import { generateDailyPlan } from '@/lib/ai/service';
import { aiErrorResponse, rateLimitGuard } from '@/lib/ai/handler';
import { DAY_MS } from '@/lib/ai/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Auth is used ONLY for rate-limit bucketing; the user id is never sent to Gemini.
    const userId = await requireAuthId();

    const limited = rateLimitGuard(userId, 'daily-planner', 10, DAY_MS);
    if (limited) return limited;

    // Validate + strip unknown keys (privacy layer 1).
    const parsed = DailyPlannerInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const plan = await generateDailyPlan(parsed.data);
    return NextResponse.json({ plan });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
