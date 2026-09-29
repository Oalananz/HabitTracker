import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import { getSkills, createSkill, updateSkill, deleteSkill } from '@/lib/services/learningService';
import { errorResponse } from '@/lib/apiErrors';

export async function GET() {
  try {
    const userId = await requireAuthId();
    const skills = await getSkills(userId);
    return NextResponse.json({ skills });
  } catch (error) {
    return errorResponse(error, 'GET /api/learning/skills');
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const skill = await createSkill(userId, {
          name: body.name,
          category: body.category,
          level: body.level,
          progressPercentage: body.progressPercentage,
          targetLevel: body.targetLevel,
        });
        return NextResponse.json({ skill });
      }
      case 'update': {
        const skill = await updateSkill(body.skillId, userId, {
          name: body.name,
          category: body.category,
          level: body.level,
          progressPercentage: body.progressPercentage,
          targetLevel: body.targetLevel,
        });
        return NextResponse.json({ skill });
      }
      case 'delete': {
        await deleteSkill(body.skillId, userId);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return errorResponse(error, 'POST /api/learning/skills');
  }
}
