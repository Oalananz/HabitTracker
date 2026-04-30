'use client';

import { useEffect, useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import PlanCard from '@/components/planner/PlanCard';
import PlanForm from '@/components/planner/PlanForm';
import dayjs from 'dayjs';

const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

const PRAYER_META: Record<string, { icon: string; gradient: string; accent: string }> = {
  fajr:    { icon: 'wb_twilight',    gradient: 'from-[#1a2340] to-[#0f1929]', accent: 'border-[#5b8def]/40' },
  dhuhr:   { icon: 'wb_sunny',       gradient: 'from-[#2a2615] to-[#1a1a10]', accent: 'border-[#fabc45]/40' },
  asr:     { icon: 'brightness_5',   gradient: 'from-[#1f2a1f] to-[#141e14]', accent: 'border-[#6cdd81]/40' },
  maghrib: { icon: 'wb_twilight',    gradient: 'from-[#2a1a1a] to-[#1e1010]', accent: 'border-[#ffb4ab]/40' },
  isha:    { icon: 'dark_mode',      gradient: 'from-[#1a1a2a] to-[#10101e]', accent: 'border-[#a2c9ff]/40' },
};

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'FAJR',
  dhuhr: 'DHUHR',
  asr: 'ASR',
  maghrib: 'MAGHRIB',
  isha: 'ISHA',
};

export default function PrayerPlannerPage() {
  const {
    plans, isPlansLoading,
    fetchPlans, createPlan, updatePlan, deletePlan,
    prayerTimes, isPrayerTimesLoading, fetchPrayerTimes, fetchPrayerTimesFromLocation,
    plannerDate, setPlannerDate,
  } = useStore();

  const [showFormFor, setShowFormFor] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [showTimeEditor, setShowTimeEditor] = useState(false);
  const [editTimes, setEditTimes] = useState<Record<string, string>>({});
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'denied' | 'error'>('idle');
  const { setManualPrayerTimes } = useStore();

  // Auto-fetch real prayer times using browser geolocation
  useEffect(() => {
    fetchPlans(plannerDate);

    // Try geolocation → real prayer times, fallback to defaults
    if (navigator.geolocation) {
      setLocationStatus('fetching');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationStatus('success');
          fetchPrayerTimesFromLocation(plannerDate, pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Geolocation denied or unavailable — use stored/defaults
          setLocationStatus('denied');
          fetchPrayerTimes(plannerDate);
        },
        { timeout: 8000, maximumAge: 300_000 } // cache position for 5 min
      );
    } else {
      setLocationStatus('error');
      fetchPrayerTimes(plannerDate);
    }
  }, [plannerDate, fetchPlans, fetchPrayerTimes, fetchPrayerTimesFromLocation]);

  // Group plans by prayer block
  const plansByPrayer = useMemo(() => {
    const groups: Record<string, typeof plans> = {
      fajr: [],
      dhuhr: [],
      asr: [],
      maghrib: [],
      isha: [],
      unassigned: [],
    };

    plans.forEach(plan => {
      if (plan.prayerBlock && groups[plan.prayerBlock]) {
        groups[plan.prayerBlock].push(plan);
      } else {
        groups.unassigned.push(plan);
      }
    });

    return groups;
  }, [plans]);

  // Determine current active prayer block
  const currentPrayer = useMemo(() => {
    if (!prayerTimes) return null;
    const now = dayjs().format('HH:mm');
    const isToday = plannerDate === dayjs().format('YYYY-MM-DD');
    if (!isToday) return null;

    const prayers = [
      { name: 'isha', time: prayerTimes.isha },
      { name: 'maghrib', time: prayerTimes.maghrib },
      { name: 'asr', time: prayerTimes.asr },
      { name: 'dhuhr', time: prayerTimes.dhuhr },
      { name: 'fajr', time: prayerTimes.fajr },
    ];
    for (const p of prayers) {
      if (now >= p.time) return p.name;
    }
    return null;
  }, [prayerTimes, plannerDate]);

  // Next prayer
  const nextPrayer = useMemo(() => {
    if (!prayerTimes) return null;
    const now = dayjs().format('HH:mm');
    const isToday = plannerDate === dayjs().format('YYYY-MM-DD');
    if (!isToday) return null;

    for (const name of PRAYER_ORDER) {
      if (now < prayerTimes[name]) return { name, time: prayerTimes[name] };
    }
    return null;
  }, [prayerTimes, plannerDate]);

  const handleCreate = async (prayerBlock: string, data: Parameters<typeof createPlan>[0]) => {
    await createPlan({ ...data, prayerBlock, startDate: plannerDate });
    setShowFormFor(null);
    fetchPlans(plannerDate);
  };

  const handleUpdate = async (data: Parameters<typeof updatePlan>[1]) => {
    if (!editingPlan) return;
    await updatePlan(editingPlan, data);
    setEditingPlan(null);
    fetchPlans(plannerDate);
  };

  const handleDelete = async (id: string) => {
    await deletePlan(id);
    fetchPlans(plannerDate);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updatePlan(id, { status: newStatus });
    fetchPlans(plannerDate);
  };

  const handleMovePrayer = async (planId: string, newBlock: string | null) => {
    await updatePlan(planId, { prayerBlock: newBlock });
    fetchPlans(plannerDate);
  };

  const handleSaveTimes = async () => {
    await setManualPrayerTimes(plannerDate, editTimes);
    setShowTimeEditor(false);
    fetchPrayerTimes(plannerDate);
  };

  const editPlanData = editingPlan ? plans.find(p => p.id === editingPlan) : null;

  // Completion stats
  const totalPlans = plans.length;
  const completedPlans = plans.filter(p => p.status === 'completed').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header>
        <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter text-on-surface mb-2">
          <span className="text-primary">&gt;</span> system/prayer-planner
        </h1>
        <p className="font-body text-on-surface-variant">
          Structure your day around the five daily prayers.
        </p>
      </header>

      {/* Top Bar: Date + Stats */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-surface-container-low p-4 rounded-md border border-outline-variant/15">
        {/* Date nav */}
        <div className="flex items-center gap-3">
          <button onClick={() => setPlannerDate(dayjs(plannerDate).subtract(1, 'day').format('YYYY-MM-DD'))} className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <div className="text-center">
            <div className="font-headline text-sm font-bold uppercase tracking-wider text-on-surface">
              {dayjs(plannerDate).format('dddd')}
            </div>
            <div className="font-mono text-xs text-on-surface-variant">
              {dayjs(plannerDate).format('MMMM D, YYYY')}
            </div>
          </div>
          <button onClick={() => setPlannerDate(dayjs(plannerDate).add(1, 'day').format('YYYY-MM-DD'))} className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
          <button
            onClick={() => setPlannerDate(dayjs().format('YYYY-MM-DD'))}
            className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors ml-2"
          >
            Today
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          {nextPrayer && (
            <div className="text-right">
              <div className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant">NEXT_PRAYER</div>
              <div className="font-headline text-sm font-bold text-primary">
                {PRAYER_LABELS[nextPrayer.name]} <span className="font-mono text-xs text-on-surface-variant">{nextPrayer.time}</span>
              </div>
            </div>
          )}
          <div className="text-right">
            <div className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant">COMPLETION</div>
            <div className="font-headline text-sm font-bold text-on-surface">
              {completedPlans}<span className="text-on-surface-variant">/{totalPlans}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant">SOURCE</div>
            <div className="font-mono text-[10px] flex items-center gap-1 justify-end">
              {isPrayerTimesLoading || locationStatus === 'fetching' ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" /><span className="text-tertiary">Locating...</span></>
              ) : prayerTimes?.source === 'api' ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-primary" /><span className="text-primary">GPS</span></>
              ) : prayerTimes?.source === 'manual' ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-tertiary" /><span className="text-tertiary">Manual</span></>
              ) : (
                <><span className="w-1.5 h-1.5 rounded-full bg-outline" /><span className="text-outline">Default</span></>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              if (prayerTimes) {
                setEditTimes({
                  fajr: prayerTimes.fajr,
                  dhuhr: prayerTimes.dhuhr,
                  asr: prayerTimes.asr,
                  maghrib: prayerTimes.maghrib,
                  isha: prayerTimes.isha,
                });
              }
              setShowTimeEditor(!showTimeEditor);
            }}
            className="text-on-surface-variant hover:text-primary transition-colors p-1"
            title="Edit prayer times"
          >
            <span className="material-symbols-outlined text-[20px]">schedule</span>
          </button>
        </div>
      </div>

      {/* Prayer Time Editor */}
      {showTimeEditor && (
        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-md p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-primary font-headline">&gt;</span>
            <span className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">PRAYER_TIMES_CONFIG</span>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {PRAYER_ORDER.map(prayer => (
              <div key={prayer}>
                <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">
                  {PRAYER_LABELS[prayer]}
                </label>
                <input
                  type="time"
                  value={editTimes[prayer] || (prayerTimes ? prayerTimes[prayer] : '')}
                  onChange={(e) => setEditTimes({ ...editTimes, [prayer]: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant/15 rounded-sm px-2 py-1.5 text-xs font-mono text-on-surface focus:border-primary/50 transition-colors"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => setShowTimeEditor(false)} className="px-3 py-1.5 text-xs font-label uppercase text-on-surface-variant hover:text-on-surface transition-colors">
              Cancel
            </button>
            <button onClick={handleSaveTimes} className="px-4 py-1.5 bg-scanline-gradient text-on-primary text-xs font-label uppercase font-bold rounded-sm hover:opacity-90 transition-opacity">
              Save Times
            </button>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editingPlan && editPlanData && (
        <PlanForm
          isEdit
          onSubmit={handleUpdate}
          onCancel={() => setEditingPlan(null)}
          initialData={{
            title: editPlanData.title,
            description: editPlanData.description || '',
            planType: editPlanData.planType,
            status: editPlanData.status,
            priority: editPlanData.priority,
            category: editPlanData.category || '',
            notes: editPlanData.notes || '',
            startDate: editPlanData.startDate,
            endDate: editPlanData.endDate || '',
            prayerBlock: editPlanData.prayerBlock,
          }}
        />
      )}

      {/* Prayer Blocks */}
      {isPlansLoading ? (
        <div className="flex items-center gap-2 py-8 justify-center font-mono text-sm text-on-surface-variant">
          <span className="animate-blink text-primary">▊</span> Loading prayer planner...
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {PRAYER_ORDER.map(prayer => {
            const meta = PRAYER_META[prayer];
            const prayerPlans = plansByPrayer[prayer] || [];
            const completed = prayerPlans.filter(p => p.status === 'completed').length;
            const isActive = currentPrayer === prayer;
            const prayerTime = prayerTimes ? prayerTimes[prayer] : '--:--';

            return (
              <div
                key={prayer}
                className={`rounded-md border overflow-hidden transition-all ${
                  isActive ? `${meta.accent} ring-1 ring-offset-0` : 'border-outline-variant/15'
                }`}
              >
                {/* Prayer Header */}
                <div className={`bg-gradient-to-r ${meta.gradient} px-5 py-3 flex justify-between items-center`}>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[22px] text-on-surface-variant">
                      {meta.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline text-sm font-bold uppercase tracking-wider text-on-surface">
                          {PRAYER_LABELS[prayer]}
                        </h3>
                        {isActive && (
                          <span className="px-1.5 py-0.5 rounded-[2px] bg-primary/20 font-label text-[8px] text-primary uppercase tracking-wider animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs text-on-surface-variant">{prayerTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">
                      {completed}/{prayerPlans.length} done
                    </span>
                    <button
                      onClick={() => setShowFormFor(showFormFor === prayer ? null : prayer)}
                      className="text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    </button>
                  </div>
                </div>

                {/* Quick Add Form */}
                {showFormFor === prayer && (
                  <div className="border-b border-outline-variant/10 p-4">
                    <PlanForm
                      onSubmit={(data) => handleCreate(prayer, data)}
                      onCancel={() => setShowFormFor(null)}
                      initialData={{ startDate: plannerDate, prayerBlock: prayer }}
                    />
                  </div>
                )}

                {/* Plans list */}
                <div className="p-3 bg-surface-container-lowest min-h-[60px]">
                  {prayerPlans.length === 0 ? (
                    <div className="text-center py-4">
                      <span className="font-mono text-[10px] text-outline">No plans assigned to this prayer block</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {prayerPlans.map(plan => (
                        <div key={plan.id} className="group/item relative">
                          <PlanCard
                            id={plan.id}
                            title={plan.title}
                            description={plan.description}
                            planType={plan.planType}
                            status={plan.status}
                            priority={plan.priority}
                            category={plan.category}
                            prayerBlock={plan.prayerBlock}
                            startDate={plan.startDate}
                            endDate={plan.endDate}
                            compact
                            onStatusChange={handleStatusChange}
                            onEdit={(id) => { setEditingPlan(id); setShowFormFor(null); }}
                            onDelete={handleDelete}
                          />
                          {/* Move to another prayer block */}
                          <div className="absolute right-2 top-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <select
                              value={plan.prayerBlock || ''}
                              onChange={(e) => handleMovePrayer(plan.id, e.target.value || null)}
                              className="bg-surface-container-high border border-outline-variant/15 rounded-sm px-1 py-0.5 text-[8px] font-label text-on-surface-variant uppercase cursor-pointer"
                            >
                              <option value="">Unassign</option>
                              {PRAYER_ORDER.map(p => (
                                <option key={p} value={p}>{PRAYER_LABELS[p]}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Unassigned Plans */}
          {plansByPrayer.unassigned.length > 0 && (
            <div className="rounded-md border border-outline-variant/15 overflow-hidden">
              <div className="bg-surface-container-low px-5 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[22px] text-outline">event_note</span>
                  <div>
                    <h3 className="font-headline text-sm font-bold uppercase tracking-wider text-on-surface-variant">
                      UNASSIGNED
                    </h3>
                    <span className="font-mono text-xs text-outline">No prayer block</span>
                  </div>
                </div>
                <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">
                  {plansByPrayer.unassigned.length} plans
                </span>
              </div>
              <div className="p-3 bg-surface-container-lowest">
                <div className="flex flex-col gap-2">
                  {plansByPrayer.unassigned.map(plan => (
                    <div key={plan.id} className="group/item relative">
                      <PlanCard
                        id={plan.id}
                        title={plan.title}
                        description={plan.description}
                        planType={plan.planType}
                        status={plan.status}
                        priority={plan.priority}
                        category={plan.category}
                        prayerBlock={plan.prayerBlock}
                        startDate={plan.startDate}
                        endDate={plan.endDate}
                        compact
                        onStatusChange={handleStatusChange}
                        onEdit={(id) => { setEditingPlan(id); setShowFormFor(null); }}
                        onDelete={handleDelete}
                      />
                      <div className="absolute right-2 top-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <select
                          value=""
                          onChange={(e) => handleMovePrayer(plan.id, e.target.value || null)}
                          className="bg-surface-container-high border border-outline-variant/15 rounded-sm px-1 py-0.5 text-[8px] font-label text-on-surface-variant uppercase cursor-pointer"
                        >
                          <option value="">Assign to...</option>
                          {PRAYER_ORDER.map(p => (
                            <option key={p} value={p}>{PRAYER_LABELS[p]}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
