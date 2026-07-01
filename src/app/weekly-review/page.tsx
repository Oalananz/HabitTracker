'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { LIFE_AREAS } from '@/lib/lifeAreas';
import { useToast } from '@/store/useToast';
import AiWeeklyReview from '@/components/ai/AiWeeklyReview';
import type { WeeklyReviewInput, WeeklyReviewOutput } from '@/lib/ai/schemas';
import dayjs from 'dayjs';

interface ReviewForm {
  wins: string;
  problems: string;
  lessons: string;
  nextWeekPriorities: string;
  healthReview: string;
  moneyReview: string;
  workBusinessReview: string;
  learningReview: string;
  familySocialReview: string;
  personalReview: string;
}

interface SavedReview extends ReviewForm {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  createdAt: string;
}

const EMPTY: ReviewForm = {
  wins: '', problems: '', lessons: '', nextWeekPriorities: '',
  healthReview: '', moneyReview: '', workBusinessReview: '',
  learningReview: '', familySocialReview: '', personalReview: '',
};

const REFLECTION_FIELDS: { key: keyof ReviewForm; label: string; placeholder: string }[] = [
  { key: 'wins', label: 'Wins this week', placeholder: 'What went well this week?' },
  { key: 'problems', label: 'Problems this week', placeholder: 'What slowed you down?' },
  { key: 'lessons', label: 'Lessons learned', placeholder: 'What did you learn about yourself?' },
  { key: 'nextWeekPriorities', label: 'Next week priorities', placeholder: 'Choose 3 important priorities for next week.' },
  { key: 'healthReview', label: 'Health review', placeholder: 'How was your sleep, exercise, food, and energy?' },
  { key: 'moneyReview', label: 'Money review', placeholder: 'Did you control spending and make progress financially?' },
  { key: 'workBusinessReview', label: 'Work / Business review', placeholder: 'What moved your work or business forward?' },
  { key: 'learningReview', label: 'Learning review', placeholder: 'What did you study or practice?' },
  { key: 'familySocialReview', label: 'Family / Social review', placeholder: 'Did you give enough time to important people?' },
  { key: 'personalReview', label: 'Personal review', placeholder: 'How was your discipline, routine, faith, home, and personal life?' },
];

function statusFor(progress: number, hasData: boolean): { label: string; color: string } {
  if (!hasData) return { label: 'No Data', color: '#8a8f98' };
  if (progress >= 70) return { label: 'Strong', color: '#6cdd81' };
  if (progress >= 40) return { label: 'Okay', color: '#fabc45' };
  return { label: 'Needs Attention', color: '#ffb4ab' };
}

interface WeekTask { id: string; completed: boolean; lifeArea?: string | null; sourceType: string }

export default function WeeklyReviewPage() {
  const { goals, fetchGoals, habits, fetchHabits } = useStore();
  const { addToast } = useToast();

  const today = dayjs();
  const [weekStart, setWeekStart] = useState(today.startOf('week'));
  const weekEnd = weekStart.endOf('week');
  const [tasks, setTasks] = useState<WeekTask[]>([]);

  const [form, setForm] = useState<ReviewForm>(EMPTY);
  const [reviews, setReviews] = useState<SavedReview[]>([]);
  const [saving, setSaving] = useState(false);
  const [moneyBalance, setMoneyBalance] = useState<{ value: number; currency: string } | null>(null);
  const [studyTimeMinutes, setStudyTimeMinutes] = useState<number | null>(null);

  const set = (key: keyof ReviewForm, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch('/api/weekly-review');
      const data = await res.json();
      if (res.ok) setReviews(data.reviews || []);
    } catch { /* offline */ }
  }, []);

  // Prefill the form when the selected week changes
  const loadWeek = useCallback(async (start: string) => {
    try {
      const res = await fetch(`/api/weekly-review?weekStart=${start}`);
      const data = await res.json();
      if (res.ok && data.review) {
        const r = data.review as SavedReview;
        setForm({
          wins: r.wins, problems: r.problems, lessons: r.lessons, nextWeekPriorities: r.nextWeekPriorities,
          healthReview: r.healthReview, moneyReview: r.moneyReview, workBusinessReview: r.workBusinessReview,
          learningReview: r.learningReview, familySocialReview: r.familySocialReview, personalReview: r.personalReview,
        });
      } else {
        setForm(EMPTY);
      }
    } catch { setForm(EMPTY); }
  }, []);

  useEffect(() => {
    void fetchGoals();
    void fetchHabits();
    void loadReviews();

    // Best-effort — a failed fetch (e.g. tables not migrated yet) must
    // never break the rest of the weekly review page.
    (async () => {
      try {
        const res = await fetch('/api/money/summary');
        if (res.ok) {
          const data = await res.json();
          setMoneyBalance({ value: data.summary?.netBalance ?? 0, currency: data.summary?.currency ?? 'JOD' });
        }
      } catch { /* ignore */ }
      try {
        const res = await fetch('/api/learning/summary');
        if (res.ok) {
          const data = await res.json();
          setStudyTimeMinutes(data.summary?.studyTimeThisWeekMinutes ?? 0);
        }
      } catch { /* ignore */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadWeek(weekStart.format('YYYY-MM-DD'));
    // Fetch the selected week's tasks for accurate weekly counts
    (async () => {
      try {
        const res = await fetch(`/api/tasks/range?start=${weekStart.format('YYYY-MM-DD')}&end=${weekEnd.format('YYYY-MM-DD')}`);
        const data = await res.json();
        if (res.ok) setTasks(data.tasks || []);
      } catch { setTasks([]); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, loadWeek]);

  // ── Summary + breakdown (computed from available store data) ──────
  const breakdown = useMemo(() => {
    return LIFE_AREAS.map((area) => {
      const areaGoals = goals.filter((g) => g.lifeArea === area.id);
      const areaHabits = habits.filter((h) => h.isActive && h.lifeArea === area.id);
      const areaTasks = tasks.filter((t) => t.lifeArea === area.id);
      const completedTasks = areaTasks.filter((t) => t.completed).length;
      const activeGoals = areaGoals.filter((g) => !g.completed).length;

      const trackable = [...areaGoals.map((g) => g.completed), ...areaTasks.map((t) => t.completed)];
      const hasData = trackable.length > 0 || areaHabits.length > 0;
      const progress = trackable.length > 0 ? Math.round((trackable.filter(Boolean).length / trackable.length) * 100) : 0;

      return { area, completedTasks, completedHabits: areaHabits.length, activeGoals, progress, ...statusFor(progress, hasData), hasData };
    });
  }, [goals, habits, tasks]);

  const summary = useMemo(() => {
    const withData = breakdown.filter((b) => b.hasData);
    const best = withData.length ? withData.reduce((a, b) => (b.progress > a.progress ? b : a)) : null;
    const weakest = withData.length ? withData.reduce((a, b) => (b.progress < a.progress ? b : a)) : null;
    const tasksCompleted = tasks.filter((t) => t.completed).length;
    const habitsTotal = habits.filter((h) => h.isActive).length;
    const habitTasks = tasks.filter((t) => t.lifeArea !== undefined && t.sourceType === 'habit');
    const habitRate = habitTasks.length ? Math.round((habitTasks.filter((t) => t.completed).length / habitTasks.length) * 100) : 0;
    const goalsCompleted = goals.filter((g) => g.completed).length;
    const overdue = goals.filter((g) => g.goalType === 'dated' && !g.completed && g.targetDate && dayjs(g.targetDate).isBefore(today, 'day')).length;
    return { best, weakest, tasksCompleted, habitsTotal, habitRate, goalsCompleted, overdue };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakdown, goals, habits, tasks]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/weekly-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStartDate: weekStart.format('YYYY-MM-DD'),
          weekEndDate: weekEnd.format('YYYY-MM-DD'),
          ...form,
        }),
      });
      if (res.ok) {
        addToast('Weekly review saved', 'success', 2000);
        await loadReviews();
      } else {
        addToast('Failed to save review', 'error');
      }
    } catch {
      addToast('Failed to save review (offline)', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Build the privacy-minimized AI input from aggregated stats + the user's
  // own reflection text only (no ids, emails, descriptions, or notes).
  const buildAiInput = (): WeeklyReviewInput => ({
    weekStartDate: weekStart.format('YYYY-MM-DD'),
    weekEndDate: weekEnd.format('YYYY-MM-DD'),
    summaryStats: {
      completedTasks: summary.tasksCompleted,
      totalTasks: tasks.length,
      overdueTasks: summary.overdue,
      habitCompletionRate: summary.habitRate,
      activeGoals: goals.filter((g) => g.isActive !== false && !g.completed).length,
      completedGoals: summary.goalsCompleted,
    },
    lifeAreaStats: breakdown.map((b) => ({
      lifeArea: b.area.label,
      completedTasks: b.completedTasks,
      totalTasks: tasks.filter((t) => t.lifeArea === b.area.id).length,
      completedHabits: b.completedHabits,
      totalHabits: habits.filter((h) => h.isActive && h.lifeArea === b.area.id).length,
      activeGoals: b.activeGoals,
      progressPercentage: b.progress,
    })),
    existingReflection: {
      wins: form.wins, problems: form.problems, lessons: form.lessons, nextWeekPriorities: form.nextWeekPriorities,
    },
  });

  // Apply AI suggestions without overwriting: append under a heading if the
  // field already has manually-written text.
  const applyAi = (review: WeeklyReviewOutput) => {
    const merge = (key: keyof ReviewForm, text: string) => {
      if (!text.trim()) return;
      const current = form[key];
      set(key, current.trim() ? `${current}\n\n--- AI Suggestions ---\n${text}` : text);
    };
    merge('wins', review.wins.join('\n'));
    merge('problems', review.problems.join('\n'));
    merge('lessons', review.patterns.join('\n'));
    merge('nextWeekPriorities', review.nextWeekPriorities.map((p) => `- ${p.title}: ${p.reason}`).join('\n'));
    addToast('Applied AI suggestions to the form', 'success', 2500);
  };

  const summaryCards = [
    { label: 'TASKS_DONE', value: summary.tasksCompleted },
    { label: 'HABIT_RATE', value: `${summary.habitRate}%` },
    { label: 'GOALS_DONE', value: summary.goalsCompleted },
    { label: 'OVERDUE', value: summary.overdue },
    { label: 'BEST_AREA', value: summary.best ? summary.best.area.shortLabel : '—' },
    { label: 'WEAKEST', value: summary.weakest ? summary.weakest.area.shortLabel : '—' },
    { label: 'NET_BALANCE', value: moneyBalance ? `${moneyBalance.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${moneyBalance.currency}` : '—' },
    { label: 'STUDY_TIME', value: studyTimeMinutes != null ? `${Math.round((studyTimeMinutes / 60) * 10) / 10}h` : '—' },
  ];

  return (
    <div className="space-y-8 animate-page-enter">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter text-on-surface mb-2">
            <span className="text-primary">&gt;</span> Weekly Review
          </h1>
          <p className="font-body text-on-surface-variant">Reflect on your week across the six life areas.</p>
        </div>
        {/* Week nav */}
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekStart(weekStart.subtract(1, 'week'))} className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <div className="text-center">
            <div className="font-mono text-xs text-on-surface">{weekStart.format('MMM D')} – {weekEnd.format('MMM D, YYYY')}</div>
          </div>
          <button
            onClick={() => setWeekStart(weekStart.add(1, 'week'))}
            disabled={weekStart.add(1, 'week').isAfter(today)}
            className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </header>

      {/* AI Weekly Review */}
      <AiWeeklyReview buildInput={buildAiInput} onApply={applyAi} />

      {/* A. Current Week Summary */}
      <section>
        <h2 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide mb-3"><span className="text-primary">&gt;</span> WEEK_SUMMARY</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {summaryCards.map((c) => (
            <div key={c.label} className="bg-surface-container-low border border-outline-variant/15 rounded-md p-3">
              <div className="font-headline text-xl font-black text-on-surface truncate">{c.value}</div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant">{c.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* B. Life Area Breakdown */}
      <section>
        <h2 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide mb-3"><span className="text-primary">&gt;</span> AREA_BREAKDOWN</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {breakdown.map((b) => (
            <div key={b.area.id} className="bg-surface-container-low border rounded-md p-4" style={{ borderColor: `${b.area.color}33` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]" style={{ color: b.area.color }}>{b.area.icon}</span>
                  <span className="font-headline text-sm font-bold text-on-surface">{b.area.label}</span>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-[2px]" style={{ color: b.color, backgroundColor: `${b.color}1a` }}>{b.label}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-2">
                <div><div className="font-headline text-base font-bold text-on-surface">{b.completedTasks}</div><div className="font-mono text-[8px] uppercase text-on-surface-variant">TASKS</div></div>
                <div><div className="font-headline text-base font-bold text-on-surface">{b.completedHabits}</div><div className="font-mono text-[8px] uppercase text-on-surface-variant">HABITS</div></div>
                <div><div className="font-headline text-base font-bold text-on-surface">{b.activeGoals}</div><div className="font-mono text-[8px] uppercase text-on-surface-variant">GOALS</div></div>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${b.progress}%`, backgroundColor: b.area.color }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* C. Reflection Form */}
      <section>
        <h2 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide mb-3"><span className="text-primary">&gt;</span> REFLECTION</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REFLECTION_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">&gt; {f.label}</label>
              <textarea
                value={form[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                rows={3}
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm font-body placeholder:text-outline focus:border-primary/50 focus:ring-0 resize-none"
              />
            </div>
          ))}
        </div>

        {/* D. Save */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Review ↵'}
          </button>
        </div>
      </section>

      {/* E. Previous Reviews */}
      <section>
        <h2 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide mb-3"><span className="text-primary">&gt;</span> PREVIOUS_REVIEWS</h2>
        {reviews.length === 0 ? (
          <p className="font-mono text-[11px] text-outline py-4 text-center border border-dashed border-outline-variant/20 rounded-sm">No saved reviews yet.</p>
        ) : (
          <div className="space-y-2">
            {reviews.map((r) => (
              <button
                key={r.id}
                onClick={() => setWeekStart(dayjs(r.weekStartDate).startOf('week'))}
                className="w-full text-left bg-surface-container-low border border-outline-variant/15 rounded-md p-3 hover:border-primary/30 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-mono text-xs text-on-surface">{dayjs(r.weekStartDate).format('MMM D')} – {dayjs(r.weekEndDate).format('MMM D, YYYY')}</div>
                  <div className="font-body text-[11px] text-on-surface-variant truncate mt-0.5">{r.wins || r.nextWeekPriorities || 'No summary'}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono text-[9px] text-outline">{dayjs(r.createdAt).format('MMM D')}</span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">edit</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
