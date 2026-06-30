import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { RecoveryInsightInputSchema } from '@/lib/ai/schemas';
import { generateRecoveryInsight } from '@/lib/ai/service';
import { aiErrorResponse, rateLimitGuard } from '@/lib/ai/handler';
import { DAY_MS } from '@/lib/ai/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Auth is used ONLY for rate-limit bucketing; the user id is never sent to Gemini.
    const userId = await requireAuthId();

    const limited = rateLimitGuard(userId, 'recovery-insight', 10, DAY_MS);
    if (limited) return limited;

    // Validate + strip unknown keys (privacy layer 1).
    const parsed = RecoveryInsightInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const insight = await generateRecoveryInsight(parsed.data);
    return NextResponse.json({ insight });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
