import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { getCertificates, createCertificate, deleteCertificate } from '@/lib/services/learningService';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const certificates = await getCertificates(userId);
    return NextResponse.json({ certificates });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/learning/certificates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const certificate = await createCertificate(userId, {
          title: body.title,
          provider: body.provider,
          issueDate: body.issueDate,
          certificateUrl: body.certificateUrl,
          fileUrl: body.fileUrl,
        });
        return NextResponse.json({ certificate });
      }
      case 'delete': {
        await deleteCertificate(body.certificateId, userId);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/learning/certificates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
