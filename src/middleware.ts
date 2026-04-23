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
    '/calendar/:path*',
    '/habits/:path*',
    '/settings/:path*',
  ],
};
