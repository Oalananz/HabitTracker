import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import {
  getPrayerTimes,
  setManualPrayerTimes,
  fetchAndStorePrayerTimes,
} from '@/lib/services/prayerTimeService';
import dayjs from 'dayjs';
import { errorResponse } from '@/lib/apiErrors';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || dayjs().format('YYYY-MM-DD');

    const times = await getPrayerTimes(userId, date);
    return NextResponse.json({ prayerTimes: times });
  } catch (error) {
    return errorResponse(error, 'GET /api/prayer-times');
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuthId();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'setManual': {
        const times = await setManualPrayerTimes(userId, body.date, {
          fajr: body.fajr,
          sunrise: body.sunrise,
          dhuhr: body.dhuhr,
          asr: body.asr,
          maghrib: body.maghrib,
          isha: body.isha,
        });
        return NextResponse.json({ prayerTimes: times });
      }
      case 'fetchFromLocation': {
        const times = await fetchAndStorePrayerTimes(
          userId,
          body.date,
          body.latitude,
          body.longitude
        );
        return NextResponse.json({ prayerTimes: times });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return errorResponse(error, 'POST /api/prayer-times');
  }
}
