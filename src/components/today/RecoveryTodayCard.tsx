'use client';

import { useState } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { useStore } from '@/store/useStore';
import { useToast } from '@/store/useToast';
import type { DayRecord, DayRecordUpdate } from '@/lib/services/dayRecordService';
import type { RecoveryInsightOutput } from '@/lib/ai/schemas';
import { AiLoadingState, AiErrorState } from '@/components/ai/AiPrimitives';

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
  const { updateDayRecord, addActivityLog, journeys, failures, tasks, recordJourneyFailure, deleteFailure } = useStore();
  const { addToast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [slipJourney, setSlipJourney] = useState<{ id: string; title: string } | null>(null);
  const [slipForm, setSlipForm] = useState<SlipForm>(EMPTY_SLIP);
  const [showInsight, setShowInsight] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [insight, setInsight] = useState<RecoveryInsightOutput | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);

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

  const analyzeRisk = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setInsightError(null);
    try {
      const weekAgo = dayjs(date).subtract(6, 'day').startOf('day');
      const journeyInputs = journeys.map(j => {
        const jf = failures.filter(f => f.journeyId === j.id);
        return {
          cleanDays: Math.max(0, dayjs(date).endOf('day').diff(dayjs(j.startTime), 'day')),
          totalSlips: jf.length,
          slippedToday: jf.some(f => dayjs(f.timestamp).format('YYYY-MM-DD') === date),
          slipsLast7Days: jf.filter(f => !dayjs(f.timestamp).isBefore(weekAgo)).length,
        };
      });
      const prayersDone = (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).filter(k => dayRecord[k]).length;
      const body = {
        date,
        journeys: journeyInputs,
        context: {
          dailyScore: dayRecord.dailyScore,
          sleepHours: dayRecord.sleepHours,
          sleepGoal: dayRecord.sleepGoal,
          focusHours: dayRecord.focusHours,
          prayersDone,
          tasksCompleted: tasks.filter(t => t.completed).length,
          tasksTotal: tasks.length,
        },
      };
      const res = await fetch('/api/ai/recovery-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setInsightError(data.error || 'AI request failed.'); return; }
      setInsight(data.insight);
      addActivityLog('DISCIPLINE', 'AI recovery insight generated');
    } catch {
      setInsightError('Network error. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const riskStyle: Record<string, string> = {
    low: 'text-primary bg-primary/10 border-primary/30',
    moderate: 'text-tertiary bg-tertiary/10 border-tertiary/30',
    high: 'text-error bg-error/10 border-error/30',
  };

  // Minimum data needed for AI risk analysis (at least 3 days of data)
  const hasEnoughData = journeys.some(j => {
    const daysSinceStart = dayjs(date).diff(dayjs(j.startTime), 'day');
    return daysSinceStart >= 3;
  });

  return (
    <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-base font-bold text-on-surface">
          <span className="text-primary">&gt;</span> Recovery / Self-Control
        </h3>
        <Link
          href="/recovery"
          className="font-label text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-wider flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-[13px]">tune</span>
          History
        </Link>
      </div>

      {journeys.length === 0 ? (
        <Link
          href="/recovery"
          className="flex flex-col items-center text-center gap-1 py-4 border border-dashed border-outline-variant/25 rounded-sm hover:border-primary/40 hover:text-primary transition-colors"
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
                <div
                  key={j.id}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-sm border min-h-[44px] ${
                    failed
                      ? 'border-error/20 bg-error/5'
                      : 'border-outline-variant/15 bg-surface-container-lowest'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="font-label text-xs font-bold text-on-surface block truncate">{j.title}</span>
                    {!failed ? (
                      <span className="font-mono text-[9px] text-primary/80">🔥 {cleanDays}d clean</span>
                    ) : (
                      <span className="font-mono text-[9px] text-error">Slip recorded today</span>
                    )}
                  </div>

                  {/* Context-sensitive single action */}
                  {failed ? (
                    <button
                      onClick={() => markClean(j.id, j.title)}
                      disabled={isUpdating}
                      className="flex-shrink-0 px-2.5 py-1.5 border border-primary/30 bg-primary/5 text-primary font-label text-[10px] uppercase rounded-sm hover:bg-primary/10 transition-all disabled:opacity-40 min-h-[36px]"
                    >
                      Mark Clean
                    </button>
                  ) : (
                    <button
                      onClick={() => setSlipJourney({ id: j.id, title: j.title })}
                      disabled={isUpdating}
                      className="flex-shrink-0 px-2.5 py-1.5 border border-error/25 bg-error/5 text-error/80 font-label text-[10px] uppercase rounded-sm hover:bg-error/10 transition-all disabled:opacity-40 min-h-[36px]"
                    >
                      Log Slip
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary row */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] text-on-surface-variant">
              Clean today: <span className="text-primary font-bold">{cleanCount}/{journeys.length}</span>
            </span>
            {/* AI Risk analysis — only show when enough data exists */}
            {hasEnoughData && (
              <button
                onClick={() => { setShowInsight(v => !v); if (!insight && !showInsight) analyzeRisk(); }}
                disabled={analyzing}
                className="inline-flex items-center gap-1 font-label text-[10px] text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[12px]">insights</span>
                {analyzing ? 'Analyzing…' : showInsight ? 'Hide insight' : 'Risk insight'}
              </button>
            )}
          </div>

          {/* AI Risk insight (hidden by default) */}
          {showInsight && (
            <div className="animate-fade-in">
              {analyzing && <AiLoadingState message="Analyzing today's risk…" />}
              {insightError && !analyzing && <AiErrorState message={insightError} onRetry={analyzeRisk} />}
              {insight && !analyzing && (
                <div className="bg-surface-container-lowest border border-primary/25 rounded-md p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary">auto_awesome</span>
                      <span className="font-label text-xs font-bold text-on-surface uppercase tracking-wide">AI Risk Insight</span>
                    </div>
                    <button onClick={() => { setInsight(null); setShowInsight(false); }} className="text-on-surface-variant hover:text-on-surface transition-colors" title="Dismiss">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 font-label text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm border ${riskStyle[insight.riskLevel]}`}>
                    {insight.riskLevel} risk today
                  </span>

                  {insight.summary && <p className="font-body text-sm text-on-surface">{insight.summary}</p>}

                  {insight.riskFactors.length > 0 && (
                    <div>
                      <div className="font-label text-[10px] uppercase tracking-widest text-tertiary mb-1">Watch for</div>
                      <ul className="space-y-0.5">
                        {insight.riskFactors.map((f, i) => <li key={i} className="font-body text-xs text-on-surface-variant">• {f}</li>)}
                      </ul>
                    </div>
                  )}

                  {insight.recommendations.length > 0 && (
                    <div>
                      <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Do next</div>
                      <ul className="space-y-0.5">
                        {insight.recommendations.map((r, i) => (
                          <li key={i} className="font-body text-xs text-on-surface flex gap-1.5">
                            <span className="material-symbols-outlined text-[13px] text-primary">arrow_right</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {insight.ifUrgeArises.length > 0 && (
                    <div className="bg-tertiary/5 border border-tertiary/20 rounded-sm p-2.5">
                      <div className="font-label text-[10px] uppercase tracking-widest text-tertiary mb-1">If an urge hits</div>
                      <ul className="space-y-0.5">
                        {insight.ifUrgeArises.map((s, i) => <li key={i} className="font-body text-xs text-on-surface-variant">• {s}</li>)}
                      </ul>
                    </div>
                  )}

                  <button onClick={analyzeRisk} className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors">
                    Regenerate
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Log Slip modal */}
      {slipJourney && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSlipJourney(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Log slip for ${slipJourney.title}`}
        >
          <div
            className="bg-surface-container-low border border-outline-variant/20 rounded-md p-5 max-w-md w-full space-y-3 animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <h4 className="font-headline text-sm font-bold text-on-surface">Log Slip — {slipJourney.title}</h4>
            <p className="font-body text-xs text-on-surface-variant">Only the trigger is required. The rest helps you spot patterns over time.</p>

            <div className="space-y-2">
              {(['trigger', 'emotion', 'situation', 'lesson', 'prevention'] as const).map(field => (
                <input
                  key={field}
                  value={slipForm[field]}
                  onChange={e => setSlipForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={
                    field === 'trigger' ? 'Trigger (required)' :
                    field === 'emotion' ? 'Emotion (optional)' :
                    field === 'situation' ? 'Situation (optional)' :
                    field === 'lesson' ? 'Lesson learned (optional)' :
                    'Prevention plan (optional)'
                  }
                  autoFocus={field === 'trigger'}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-xs font-body text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50"
                />
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => { setSlipJourney(null); setSlipForm(EMPTY_SLIP); }}
                className="px-3 py-1.5 font-label text-xs uppercase text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitSlip}
                disabled={isUpdating || !slipForm.trigger.trim()}
                className="px-4 py-1.5 bg-error text-on-error font-label text-xs uppercase font-bold rounded-sm hover:opacity-90 disabled:opacity-50"
              >
                {isUpdating ? 'Saving…' : 'Log Slip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
