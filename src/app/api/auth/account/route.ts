import { NextRequest, NextResponse } from 'next/server';
import { deleteUserAccount, SESSION_COOKIE } from '@/lib/auth';
import { requirePasswordConfirmation } from '@/lib/accountGuard';
import { errorResponse } from '@/lib/apiErrors';

// Permanently deletes the account and all of its data.
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.confirm !== 'DELETE') {
      return NextResponse.json({ error: 'Type DELETE to confirm' }, { status: 400 });
    }

    const guard = await requirePasswordConfirmation(body.password);
    if ('response' in guard) return guard.response;

    await deleteUserAccount(guard.userId);
    const response = NextResponse.json({ success: true });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  } catch (error) {
    return errorResponse(error, 'DELETE /api/auth/account');
  }
}
