import { NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { getAllFailures, deleteFailureLog } from '@/lib/services/recoveryService';
import { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/apiErrors';

export async function GET() {
  try {
    const userId = await requireAuthId();
    const logs = await getAllFailures(userId);
    return NextResponse.json({ failures: logs });
  } catch (error) {
    return errorResponse(error, 'GET /api/failures');
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
    return errorResponse(error, 'POST /api/failures');
  }
}
