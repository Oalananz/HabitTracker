'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

const CHECK_INTERVAL_MS = 60_000;

const localDate = () => dayjs().format('YYYY-MM-DD');

/**
 * The user's local calendar date (YYYY-MM-DD). Updates when the day rolls
 * over while the page stays open, and when the tab becomes visible again.
 */
export function useToday(): string {
  const [today, setToday] = useState(localDate);

  useEffect(() => {
    const refresh = () => setToday(localDate());
    const interval = setInterval(refresh, CHECK_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return today;
}
