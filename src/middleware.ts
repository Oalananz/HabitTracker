import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/today/:path*',
    '/dashboard/:path*',
    '/recovery/:path*',
    '/goals/:path*',
    '/habits/:path*',
    '/settings/:path*',
    '/planner/:path*',
    '/life-areas/:path*',
    '/money/:path*',
    '/learning/:path*',
    '/weekly-review/:path*',
    '/achievements/:path*',
    '/ai-coach/:path*',
    '/onboarding/:path*',
  ],
};
