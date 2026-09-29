import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { DEFAULT_LANDING_CONTENT, landingContentSchema } from '@/lib/landingContent';
import { getLandingRecord, resetLandingContent, saveLandingContent } from '@/lib/landingContent.server';
import { errorResponse } from '@/lib/apiErrors';

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ ...(await getLandingRecord()), defaults: DEFAULT_LANDING_CONTENT });
  } catch (error) {
    return errorResponse(error, 'GET /api/admin/landing');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const parsed = landingContentSchema.safeParse(await request.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue.path.join(' › ') || 'content';
      return NextResponse.json({ error: `${field}: ${issue.message}` }, { status: 400 });
    }
    await saveLandingContent(parsed.data, admin.id);
    revalidatePath('/'); // the static landing page picks up the change on its next request
    return NextResponse.json(await getLandingRecord());
  } catch (error) {
    return errorResponse(error, 'PUT /api/admin/landing');
  }
}

export async function DELETE() {
  try {
    await requireAdmin();
    await resetLandingContent();
    revalidatePath('/');
    return NextResponse.json(await getLandingRecord());
  } catch (error) {
    return errorResponse(error, 'DELETE /api/admin/landing');
  }
}
