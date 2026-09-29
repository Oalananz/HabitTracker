import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { getMoneyCategories, createMoneyCategory } from '@/lib/services/moneyService';
import { errorResponse } from '@/lib/apiErrors';

export async function GET() {
  try {
    const userId = await requireAuthId();
    const categories = await getMoneyCategories(userId);
    return NextResponse.json({ categories });
  } catch (error) {
    return errorResponse(error, 'GET /api/money/categories');
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const category = await createMoneyCategory(userId, {
          name: body.name,
          type: body.type,
          color: body.color,
          icon: body.icon,
        });
        return NextResponse.json({ category });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return errorResponse(error, 'POST /api/money/categories');
  }
}
