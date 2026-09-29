import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import {
  createPlan,
  updatePlan,
  deletePlan,
  getPlansByDate,
  getPlansByRange,
  getWeeklyPlans,
  getMonthlyPlans,
  assignPlanToPrayerBlock,
  getPlansSummary,
} from '@/lib/services/planService';
import dayjs from 'dayjs';
import { errorResponse } from '@/lib/apiErrors';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const week = searchParams.get('week');
    const month = searchParams.get('month');
    const summary = searchParams.get('summary');

    if (summary === 'true') {
      const data = await getPlansSummary(userId);
      return NextResponse.json({ summary: data });
    }

    if (date) {
      const plans = await getPlansByDate(userId, date);
      return NextResponse.json({ plans });
    }

    if (startDate && endDate) {
      const plans = await getPlansByRange(userId, startDate, endDate);
      return NextResponse.json({ plans });
    }

    if (week) {
      const plans = await getWeeklyPlans(userId, week);
      return NextResponse.json({ plans });
    }

    if (month) {
      const plans = await getMonthlyPlans(userId, month);
      return NextResponse.json({ plans });
    }

    // Default: return today's plans
    const plans = await getPlansByDate(userId, dayjs().format('YYYY-MM-DD'));
    return NextResponse.json({ plans });
  } catch (error) {
    return errorResponse(error, 'GET /api/plans');
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const plan = await createPlan(userId, {
          title: body.title,
          description: body.description,
          planType: body.planType,
          status: body.status,
          priority: body.priority,
          category: body.category,
          notes: body.notes,
          startDate: body.startDate,
          startTime: body.startTime,
          endDate: body.endDate,
          endTime: body.endTime,
          dayOfWeek: body.dayOfWeek,
          prayerBlock: body.prayerBlock,
          lifeArea: body.lifeArea,
        });
        return NextResponse.json({ plan });
      }
      case 'update': {
        const plan = await updatePlan(body.planId, userId, {
          title: body.title,
          description: body.description,
          planType: body.planType,
          status: body.status,
          priority: body.priority,
          category: body.category,
          notes: body.notes,
          startDate: body.startDate,
          startTime: body.startTime,
          endDate: body.endDate,
          endTime: body.endTime,
          dayOfWeek: body.dayOfWeek,
          prayerBlock: body.prayerBlock,
          lifeArea: body.lifeArea,
        });
        return NextResponse.json({ plan });
      }
      case 'delete': {
        await deletePlan(body.planId, userId);
        return NextResponse.json({ success: true });
      }
      case 'assignPrayer': {
        const plan = await assignPlanToPrayerBlock(
          body.planId,
          userId,
          body.prayerBlock
        );
        return NextResponse.json({ plan });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return errorResponse(error, 'POST /api/plans');
  }
}
