import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { getCertificates, createCertificate, deleteCertificate, updateCertificate } from '@/lib/services/learningService';
import { errorResponse } from '@/lib/apiErrors';

export async function GET() {
  try {
    const userId = await requireAuthId();
    const certificates = await getCertificates(userId);
    return NextResponse.json({ certificates });
  } catch (error) {
    return errorResponse(error, 'GET /api/learning/certificates');
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
      case 'update': {
        const certificate = await updateCertificate(body.certificateId, userId, {
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
    return errorResponse(error, 'POST /api/learning/certificates');
  }
}
