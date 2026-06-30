'use client';

import { useState } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { useStore } from '@/store/useStore';
import { useToast } from '@/store/useToast';
import type { DayRecord, DayRecordUpdate } from '@/lib/services/dayRecordService';

interface RecoveryTodayCardProps {
  dayRecord: DayRecord;
  date: string;
}

interface SlipForm {
  trigger: string;
  emotion: string;
  situation: string;
  lesson: string;
  prevention: string;
}

const EMPTY_SLIP: SlipForm = { trigger: '', emotion: '', situation: '', lesson: '', prevention: '' };

export default function RecoveryTodayCard({ dayRecord, date }: RecoveryTodayCardProps) {
  const { updateDayRecord, addActivityLog, journeys, failures, recordJourneyFailure, deleteFailure } = useStore();
  const { addToast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [slipJourney, setSlipJourney] = useState<{ id: string; title: string } | null>(null);
  const [slipForm, setSlipForm] = useState<SlipForm>(EMPTY_SLIP);
  const [analyzing, setAnalyzing] = useState(false);

  const failedToday = (journeyId: string) =>
    failures.some(f => f.journeyId === journeyId && dayjs(f.timestamp).format('YYYY-MM-DD') === date);

  const todaysFailures = (journeyId: string) =>
    failures.filter(f => f.journeyId === journeyId && dayjs(f.timestamp).format('YYYY-MM-DD') === date);

  const cleanCount = journeys.filter(j => !failedToday(j.id)).length;

  const syncDayRecord = async (clean: boolean) => {
    const fields: DayRecordUpdate = {
      noReels: clean, noMasturbation: clean, noMusic: clean, lowSugar: clean, noYapping: clean,
    };
    const needsSync =
      dayRecord.noReels !== clean || dayRecord.noMasturbation !== clean || dayRecord.noMusic !== clean ||
      dayRecord.lowSugar !== clean || dayRecord.noYapping !== clean;
    if (needsSync) await updateDayRecord(date, fields);
  };

  const markClean = async (journeyId: string, title: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      for (const f of todaysFailures(journeyId)) await deleteFailure(f.id);
      addActivityLog('DISCIPLINE', `${title} — marked clean ✓`);
      const stillClean = journeys.filter(j => j.id === journeyId || !failedToday(j.id)).length === journeys.length;
      await syncDayRecord(stillClean);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAllClean = async () => {
    const todays = failures.filter(f => f.journeyId && dayjs(f.timestamp).format('YYYY-MM-DD') === date);
    if (todays.length === 0) return;
    for (const f of todays) await deleteFailure(f.id);
    addActivityLog('DISCIPLINE', 'All journeys marked clean ✓');
    await syncDayRecord(true);
  };

  const submitSlip = async () => {
    if (!slipJourney) return;
    setIsUpdating(true);
    try {
      const note = [
        slipForm.trigger && `Trigger: ${slipForm.trigger}`,
        slipForm.emotion && `Emotion: ${slipForm.emotion}`,
        slipForm.situation && `Situation: ${slipForm.situation}`,
        slipForm.lesson && `Lesson: ${slipForm.lesson}`,
        slipForm.prevention && `Prevention plan: ${slipForm.prevention}`,
      ].filter(Boolean).join(' | ') || undefined;
      await recordJourneyFailure(slipJourney.id, note);
      addActivityLog('DISCIPLINE', `${slipJourney.title} — slip recorded`);
      await syncDayRecord(false);
      addToast('Slip recorded', 'info', 2000);
      setSlipJourney(null);
      setSlipForm(EMPTY_SLIP);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-base font-bold text-on-surface">
          <span className="text-primary">&gt;</span> Recovery / Self-Control
        </h3>
        <Link href="/recovery" className="font-label text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-wider flex items-center gap-1 transition-colors">
          <span className="material-symbols-outlined text-[13px]">tune</span> View History
        </Link>
      </div>

      {journeys.length === 0 ? (
        <Link
          href="/recovery"
          className="flex flex-col items-center text-center gap-1 py-5 border border-dashed border-outline-variant/25 rounded-sm hover:border-primary/40 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[22px] text-outline">add_circle</span>
          <span className="font-body text-xs text-on-surface-variant">No active recovery journeys — start one in Recovery</span>
        </Link>
      ) : (
        <>
          <div className="space-y-2">
            {journeys.map(j => {
              const failed = failedToday(j.id);
              const cleanDays = Math.max(0, dayjs(date).endOf('day').diff(dayjs(j.startTime), 'day'));
              return (
                <div key={j.id} className="bg-surface-container-lowest border border-outline-variant/15 rounded-sm p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-label text-xs font-bold text-on-surface">{j.title}</span>
                    {!failed ? (
                      <span className="font-mono text-[9px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-[2px]">🔥 {cleanDays}d clean</span>
                    ) : (
                      <span className="font-mono text-[9px] text-error bg-error/10 px-1.5 py-0.5 rounded-[2px]">Slip recorded today</span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => markClean(j.id, j.title)}
                      disabled={isUpdating || !failed}
                      className="px-3 py-1.5 border border-primary/30 bg-primary/5 text-primary font-label text-[10px] uppercase rounded-sm hover:bg-primary/10 transition-all disabled:opacity-40"
                    >
                      Mark Clean Today
                    </button>
                    <button
                      onClick={() => setSlipJourney({ id: j.id, title: j.title })}
                      disabled={isUpdating}
                      className="px-3 py-1.5 border border-error/30 bg-error/5 text-error font-label text-[10px] uppercase rounded-sm hover:bg-error/10 transition-all disabled:opacity-40"
                    >
                      Log Slip
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 flex-wrap items-center justify-between">
            <button
              onClick={handleAllClean}
              disabled={isUpdating || cleanCount === journeys.length}
              className="px-3 py-1.5 border border-primary/30 bg-primary/5 text-primary font-label text-[10px] uppercase rounded-sm hover:bg-primary/10 transition-all disabled:opacity-40"
            >
              ✓ All Clean Today
            </button>
            <span className="font-mono text-[10px] text-on-surface-variant">
              Clean today: <span className="text-primary font-bold">{cleanCount}/{journeys.length}</span>
            </span>
          </div>
        </>
      )}

      <button
        onClick={() => { setAnalyzing(true); setTimeout(() => setAnalyzing(false), 600); addToast('AI Recovery Insight is coming soon', 'info', 2500); }}
        disabled={analyzing}
        className="w-full px-3 py-2 border border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant hover:border-primary/30 hover:text-primary font-label text-[10px] uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-[14px]">insights</span>
        {analyzing ? 'Analyzing…' : 'Analyze Risk (Coming Soon)'}
      </button>

      {/* Log Slip modal */}
      {slipJourney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSlipJourney(null)}>
          <div
            className="bg-surface-container-low border border-outline-variant/20 rounded-md p-5 max-w-md w-full space-y-3 animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <h4 className="font-headline text-sm font-bold text-on-surface">Log Slip — {slipJourney.title}</h4>
            <p className="font-body text-xs text-on-surface-variant">Only the trigger or a quick note is required. The rest is optional but helps you spot patterns.</p>

            <div className="space-y-2">
              <input
                value={slipForm.trigger}
                onChange={e => setSlipForm(f => ({ ...f, trigger: e.target.value }))}
                placeholder="Trigger (what set this off?)"
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-xs font-body text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50"
                autoFocus
              />
              <input
                value={slipForm.emotion}
                onChange={e => setSlipForm(f => ({ ...f, emotion: e.target.value }))}
                placeholder="Emotion (optional)"
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-xs font-body text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50"
              />
              <input
                value={slipForm.situation}
                onChange={e => setSlipForm(f => ({ ...f, situation: e.target.value }))}
                placeholder="Situation (optional)"
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-xs font-body text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50"
              />
              <input
                value={slipForm.lesson}
                onChange={e => setSlipForm(f => ({ ...f, lesson: e.target.value }))}
                placeholder="Lesson learned (optional)"
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-xs font-body text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50"
              />
              <input
                value={slipForm.prevention}
                onChange={e => setSlipForm(f => ({ ...f, prevention: e.target.value }))}
                placeholder="Prevention plan (optional)"
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-xs font-body text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => { setSlipJourney(null); setSlipForm(EMPTY_SLIP); }} className="px-3 py-1.5 font-label text-xs uppercase text-on-surface-variant hover:text-on-surface transition-colors">
                Cancel
              </button>
              <button onClick={submitSlip} disabled={isUpdating} className="px-4 py-1.5 bg-error text-on-error font-label text-xs uppercase font-bold rounded-sm hover:opacity-90 disabled:opacity-50">
                Log Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
