'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { LIFE_AREAS, LIFE_AREA_IDS, type LifeAreaId } from '@/lib/lifeAreas';
import LifeAreaSelect from '@/components/ui/LifeAreaSelect';

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const router = useRouter();
  const { createGoal, createHabit, saveUserPreferences } = useStore();

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  // Step 2 — focus areas (default all selected)
  const [focusAreas, setFocusAreas] = useState<LifeAreaId[]>([...LIFE_AREA_IDS]);

  // Step 3 — first goal
  const [goalTitle, setGoalTitle] = useState('');
  const [goalArea, setGoalArea] = useState<LifeAreaId | null>(null);
  const [goalDue, setGoalDue] = useState('');

  // Step 4 — first habit
  const [habitTitle, setHabitTitle] = useState('');
  const [habitArea, setHabitArea] = useState<LifeAreaId | null>(null);
  const [habitFreq, setHabitFreq] = useState<'daily' | 'weekdays' | 'weekends'>('daily');

  // Step 5 — Money & Learning setup (all optional/skippable)
  const [monthlyBudgetTarget, setMonthlyBudgetTarget] = useState('');
  const [savingsGoalAmount, setSavingsGoalAmount] = useState('');
  const [firstCourseTitle, setFirstCourseTitle] = useState('');
  const [firstCourseUrl, setFirstCourseUrl] = useState('');
  const [firstSkillName, setFirstSkillName] = useState('');

  const toggleArea = (id: LifeAreaId) =>
    setFocusAreas((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));

  const finish = async () => {
    setBusy(true);
    try {
      if (goalTitle.trim()) {
        await createGoal({
          title: goalTitle.trim(),
          goalType: goalDue ? 'dated' : 'open',
          targetDate: goalDue || undefined,
          lifeArea: goalArea,
        });
      }
      if (habitTitle.trim()) {
        await createHabit({
          title: habitTitle.trim(),
          repeatRule: { type: habitFreq },
          lifeArea: habitArea,
        });
      }

      // Money & Learning setup — all optional, skipped silently if left blank.
      const now = new Date();
      if (monthlyBudgetTarget.trim()) {
        const amount = parseFloat(monthlyBudgetTarget);
        if (!isNaN(amount) && amount > 0) {
          await fetch('/api/money/budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create',
              month: now.getMonth() + 1,
              year: now.getFullYear(),
              amount,
            }),
          }).catch(() => {});
        }
      }
      if (savingsGoalAmount.trim()) {
        const amount = parseFloat(savingsGoalAmount);
        if (!isNaN(amount) && amount > 0) {
          await fetch('/api/money/savings-goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', title: 'Savings Goal', targetAmount: amount }),
          }).catch(() => {});
        }
      }
      if (firstCourseTitle.trim()) {
        if (firstCourseUrl.trim()) {
          await fetch('/api/learning/connections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'manual-link', title: firstCourseTitle.trim(), courseUrl: firstCourseUrl.trim() }),
          }).catch(() => {});
        } else {
          await fetch('/api/learning/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', title: firstCourseTitle.trim() }),
          }).catch(() => {});
        }
      }
      if (firstSkillName.trim()) {
        await fetch('/api/learning/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', name: firstSkillName.trim() }),
        }).catch(() => {});
      }

      await saveUserPreferences({ onboardingCompleted: true, focusAreas });
    } finally {
      setBusy(false);
      setStep(6);
    }
  };

  const Progress = () => (
    <div className="flex items-center gap-1.5 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-primary' : 'bg-surface-container-highest'}`}
        />
      ))}
    </div>
  );

  const navButtons = (onNext: () => void, nextLabel = 'Next', nextDisabled = false) => (
    <div className="flex justify-between items-center mt-8">
      <button
        onClick={() => setStep((s) => Math.max(1, s - 1))}
        disabled={step === 1}
        className="px-4 py-2 font-label text-xs uppercase tracking-wider text-on-surface-variant hover:text-on-surface disabled:opacity-30 transition-colors"
      >
        Back
      </button>
      <span className="font-mono text-[10px] text-outline">STEP {step} / {TOTAL_STEPS}</span>
      <button
        onClick={onNext}
        disabled={nextDisabled || busy}
        className="px-6 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {nextLabel}
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-page-enter">
      <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-6 md:p-8">
        <Progress />

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="text-center space-y-4 py-4">
            <span className="material-symbols-outlined text-[48px] text-primary">grid_view</span>
            <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tighter text-on-surface">Build your Life System</h1>
            <p className="font-body text-on-surface-variant max-w-md mx-auto">
              Organize your goals, habits, tasks, and reviews across the six areas of your life.
            </p>
            {navButtons(() => setStep(2), 'Get Started')}
          </div>
        )}

        {/* Step 2 — Choose Focus Areas */}
        {step === 2 && (
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">Choose your focus areas</h2>
            <p className="font-body text-sm text-on-surface-variant mb-5">Pick the areas you want to focus on first. You can change these anytime.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LIFE_AREAS.map((area) => {
                const selected = focusAreas.includes(area.id);
                return (
                  <button
                    key={area.id}
                    onClick={() => toggleArea(area.id)}
                    className="flex items-center gap-3 p-3 rounded-md border text-left transition-all"
                    style={{
                      borderColor: selected ? `${area.color}66` : 'rgba(255,255,255,0.08)',
                      backgroundColor: selected ? `${area.color}12` : 'transparent',
                    }}
                  >
                    <span className="material-symbols-outlined text-[22px]" style={{ color: area.color }}>{area.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-headline text-sm font-bold text-on-surface">{area.label}</div>
                      <div className="font-body text-[11px] text-on-surface-variant truncate">{area.description}</div>
                    </div>
                    <span className={`material-symbols-outlined text-[18px] ${selected ? 'text-primary' : 'text-outline'}`} style={{ fontVariationSettings: selected ? "'FILL' 1" : undefined }}>
                      {selected ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </button>
                );
              })}
            </div>
            {navButtons(() => setStep(3))}
          </div>
        )}

        {/* Step 3 — Add First Goal */}
        {step === 3 && (
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">Add your first goal</h2>
            <p className="font-body text-sm text-on-surface-variant mb-5">Optional — you can skip and add goals later.</p>
            <div className="space-y-4">
              <div>
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">&gt; GOAL_TITLE</label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Improve sleep schedule, Save money this month, Finish a course"
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm focus:border-primary/50 focus:ring-0 placeholder:text-outline"
                />
              </div>
              <LifeAreaSelect value={goalArea} onChange={setGoalArea} />
              <div>
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">&gt; DUE_DATE (optional)</label>
                <input
                  type="date"
                  value={goalDue}
                  onChange={(e) => setGoalDue(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm focus:border-primary/50 focus:ring-0"
                />
              </div>
            </div>
            {navButtons(() => setStep(4))}
          </div>
        )}

        {/* Step 4 — Add First Habit */}
        {step === 4 && (
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">Add your first habit</h2>
            <p className="font-body text-sm text-on-surface-variant mb-5">Optional — small, repeatable actions build the system.</p>
            <div className="space-y-4">
              <div>
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">&gt; HABIT_TITLE</label>
                <input
                  type="text"
                  value={habitTitle}
                  onChange={(e) => setHabitTitle(e.target.value)}
                  placeholder="e.g. Walk 20 minutes, Study 30 minutes, Review spending, Read 10 pages"
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm focus:border-primary/50 focus:ring-0 placeholder:text-outline"
                />
              </div>
              <LifeAreaSelect value={habitArea} onChange={setHabitArea} />
              <div>
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">&gt; FREQUENCY</label>
                <div className="flex gap-2">
                  {(['daily', 'weekdays', 'weekends'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setHabitFreq(f)}
                      className={`px-4 py-2 rounded-sm font-label text-xs uppercase tracking-wider transition-colors ${
                        habitFreq === f ? 'bg-primary text-on-primary font-bold' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-bright'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {navButtons(() => setStep(5))}
          </div>
        )}

        {/* Step 5 — Money & Learning setup (optional) */}
        {step === 5 && (
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">Money &amp; Learning setup</h2>
            <p className="font-body text-sm text-on-surface-variant mb-5">Optional — skip any or all of these and set them up later from the Money and Learning pages.</p>
            <div className="space-y-5">
              <div>
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">&gt; MONTHLY_BUDGET_TARGET (optional)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={monthlyBudgetTarget}
                  onChange={(e) => setMonthlyBudgetTarget(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm focus:border-primary/50 focus:ring-0 placeholder:text-outline"
                />
              </div>
              <div>
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">&gt; SAVINGS_GOAL_AMOUNT (optional)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={savingsGoalAmount}
                  onChange={(e) => setSavingsGoalAmount(e.target.value)}
                  placeholder="e.g. 2000"
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm focus:border-primary/50 focus:ring-0 placeholder:text-outline"
                />
              </div>
              <div>
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">&gt; FIRST_COURSE_TITLE (optional)</label>
                <input
                  type="text"
                  value={firstCourseTitle}
                  onChange={(e) => setFirstCourseTitle(e.target.value)}
                  placeholder="e.g. Advanced React Patterns"
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm focus:border-primary/50 focus:ring-0 placeholder:text-outline"
                />
              </div>
              <div>
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">&gt; COURSE_LINK (optional)</label>
                <input
                  type="url"
                  value={firstCourseUrl}
                  onChange={(e) => setFirstCourseUrl(e.target.value)}
                  placeholder="https://... (any learning website)"
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm focus:border-primary/50 focus:ring-0 placeholder:text-outline"
                />
              </div>
              <div>
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">&gt; FIRST_SKILL (optional)</label>
                <input
                  type="text"
                  value={firstSkillName}
                  onChange={(e) => setFirstSkillName(e.target.value)}
                  placeholder="e.g. TypeScript, Public Speaking"
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm focus:border-primary/50 focus:ring-0 placeholder:text-outline"
                />
              </div>
            </div>
            {navButtons(finish, busy ? 'Finishing…' : 'Finish Setup')}
          </div>
        )}

        {/* Step 6 — Finish */}
        {step === 6 && (
          <div className="text-center space-y-4 py-4">
            <span className="material-symbols-outlined text-[48px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <h1 className="font-headline text-3xl font-bold tracking-tighter text-on-surface">Your system is ready.</h1>
            <p className="font-body text-on-surface-variant">Start tracking today, or explore your life areas.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button onClick={() => router.push('/today')} className="px-6 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity">
                Go to Today
              </button>
              <button onClick={() => router.push('/life-areas')} className="px-6 py-2.5 border border-outline-variant/20 text-on-surface font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:border-primary/40 transition-colors">
                Open Life Areas
              </button>
            </div>

            <div className="pt-6 mt-6 border-t border-outline-variant/10 text-left max-w-md mx-auto">
              <p className="text-xs text-on-surface-variant/70 text-center mb-3">
                Also worth a look — not covered in this setup:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => router.push('/planner?view=prayer')}
                  className="flex items-center gap-2 p-3 rounded-sm border border-outline-variant/15 hover:border-primary/30 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">mosque</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-on-surface">Prayer view</div>
                    <div className="text-[11px] text-on-surface-variant/70">Structure your day around prayer times, in Planner</div>
                  </div>
                </button>
                <button
                  onClick={() => router.push('/recovery')}
                  className="flex items-center gap-2 p-3 rounded-sm border border-outline-variant/15 hover:border-primary/30 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">healing</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-on-surface">Recovery</div>
                    <div className="text-[11px] text-on-surface-variant/70">Track a habit you're trying to quit</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
