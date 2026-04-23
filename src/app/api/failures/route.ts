import { NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { getAllFailures, deleteFailureLog } from '@/lib/services/recoveryService';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const userId = await requireAuthId();
    const logs = await getAllFailures(userId);
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
    const userId = await requireAuthId();
    const body = await request.json();

    if (body.action === 'delete') {
      await deleteFailureLog(body.id, userId);
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
