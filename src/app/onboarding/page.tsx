'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { LIFE_AREAS, LIFE_AREA_IDS, type LifeAreaId } from '@/lib/lifeAreas';
import LifeAreaSelect from '@/components/ui/LifeAreaSelect';

const TOTAL_STEPS = 5;

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
      await saveUserPreferences({ onboardingCompleted: true, focusAreas });
    } finally {
      setBusy(false);
      setStep(5);
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
            {navButtons(finish, busy ? 'Finishing…' : 'Finish Setup')}
          </div>
        )}

        {/* Step 5 — Finish */}
        {step === 5 && (
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
          </div>
        )}
      </div>
    </div>
  );
}
