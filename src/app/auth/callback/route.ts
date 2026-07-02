import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const ALLOWED_REDIRECT_PATHS = new Set([
  '/today', '/dashboard', '/recovery', '/habits', '/settings', '/planner',
  '/goals', '/life-areas', '/money', '/learning',
  '/weekly-review', '/achievements', '/ai-coach', '/onboarding', '/',
]);

function isValidRedirectPath(path: string): boolean {
  const cleaned = path.split('?')[0].split('#')[0];
  return cleaned.startsWith('/') && !cleaned.startsWith('//') && ALLOWED_REDIRECT_PATHS.has(cleaned);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') ?? '/today';
  const next = isValidRedirectPath(nextParam) ? nextParam : '/today';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
