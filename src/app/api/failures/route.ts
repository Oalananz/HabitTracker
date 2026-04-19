import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAllFailures, deleteFailureLog } from '@/lib/services/recoveryService';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const user = await requireAuth();
    const logs = await getAllFailures(user.id);
    return NextResponse.json({ failures: logs });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    if (body.action === 'delete') {
      await deleteFailureLog(body.id, user.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
