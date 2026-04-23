import { NextRequest, NextResponse } from 'next/server';
import { requireAuthId } from '@/lib/auth';
import {
  getPrayerTimes,
  setManualPrayerTimes,
  fetchAndStorePrayerTimes,
} from '@/lib/services/prayerTimeService';

export async function GET(request: NextRequest) {
  const t0 = performance.now();
  try {
    const userId = await requireAuthId();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const times = await getPrayerTimes(userId, date);
    return NextResponse.json({ prayerTimes: times });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('GET /api/prayer-times error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    const t1 = performance.now();
    console.log(`[GET /api/prayer-times] took ${(t1 - t0).toFixed(2)}ms`);
  }
}

export async function POST(request: NextRequest) {
  const t0 = performance.now();
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
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('POST /api/prayer-times error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  } finally {
    const t1 = performance.now();
    console.log(`[POST /api/prayer-times] took ${(t1 - t0).toFixed(2)}ms`);
  }
}
