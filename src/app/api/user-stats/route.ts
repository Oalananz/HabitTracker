import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: stats } = await db
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return NextResponse.json({ stats });
}
