import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/sessionCookie';

/**
 * Optimistic check for the landing page: visitors holding a session cookie go
 * straight to their day. The real session check happens in the app; a stale
 * cookie is cleared by /api/auth/me, after which the landing page shows again.
 * Keeping this out of the page lets "/" be static and cacheable.
 */
export function proxy(request: NextRequest) {
  // ?preview lets signed-in admins view the landing page they are editing.
  if (request.cookies.has(SESSION_COOKIE) && !request.nextUrl.searchParams.has('preview')) {
    return NextResponse.redirect(new URL('/today', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
