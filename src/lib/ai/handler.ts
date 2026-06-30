/**
 * Shared helpers for AI API routes: a uniform error → HTTP mapping and a
 * rate-limit guard. Keeps every route consistent and avoids leaking stack
 * traces or raw error details to the client.
 */
import { NextResponse } from 'next/server';
import { AiConfigError, AiGenerationError } from './geminiClient';
import { checkRateLimit } from './rateLimit';

/** Map known errors to safe, user-friendly responses (no stack traces). */
export function aiErrorResponse(error: unknown): NextResponse {
  if (error instanceof AiConfigError) {
    // Developer-facing but secret-free: tells you to set the env var.
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  if (error instanceof AiGenerationError) {
    return NextResponse.json({ error: 'AI could not generate a valid plan. Please try again.' }, { status: 502 });
  }
  if ((error as Error)?.message === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Generic — never echo the raw error to the client.
  return NextResponse.json({ error: 'Something went wrong contacting the AI service.' }, { status: 500 });
}

/** Returns a 429 response if the caller is over the limit, else null. */
export function rateLimitGuard(key: string, feature: string, limit: number, windowMs: number): NextResponse | null {
  const result = checkRateLimit(key, feature, limit, windowMs);
  if (!result.ok) {
    return NextResponse.json(
      { error: 'Rate limit reached. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) } },
    );
  }
  return null;
}
