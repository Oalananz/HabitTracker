'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useStore } from '@/store/useStore';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { useConfirm } from '@/components/ui/useConfirm';
import PlanCard from '@/components/planner/PlanCard';
import PlanForm from '@/components/planner/PlanForm';
import DayTimeline from '@/components/planner/DayTimeline';
import type { TimelineEvent } from '@/components/planner/DayTimeline';
import { downloadCsv } from '@/lib/csvExport';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

type ViewMode = 'daily' | 'weekly' | 'monthly' | 'prayer';

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

const PRAYER_META: Record<string, { icon: string; gradient: string; accent: string }> = {
  fajr:    { icon: 'wb_twilight',    gradient: 'from-[#1a2340] to-[#0f1929]', accent: 'border-[#5b8def]/40' },
  dhuhr:   { icon: 'wb_sunny',       gradient: 'from-[#2a2615] to-[#1a1a10]', accent: 'border-[#fabc45]/40' },
  asr:     { icon: 'brightness_5',   gradient: 'from-[#1f2a1f] to-[#141e14]', accent: 'border-[#6cdd81]/40' },
  maghrib: { icon: 'wb_twilight',    gradient: 'from-[#2a1a1a] to-[#1e1010]', accent: 'border-[#ffb4ab]/40' },
  isha:    { icon: 'dark_mode',      gradient: 'from-[#1a1a2a] to-[#10101e]', accent: 'border-[#a2c9ff]/40' },
};

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

type DayRecordKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
const prayerToField: Record<string, DayRecordKey> = {
  fajr: 'fajr', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha',
};

export default function PlannerPage() {
  const {
    plans, plansSummary, isPlansLoading,
    fetchPlans, fetchWeeklyPlans, fetchMonthlyPlans, fetchPlansSummary,
    createPlan, updatePlan, deletePlan,
    plannerDate, setPlannerDate,
    prayerTimes, isPrayerTimesLoading, fetchPrayerTimes, fetchPrayerTimesFromLocation, setManualPrayerTimes,
    dayRecord, fetchDayRecord, updateDayRecord,
  } = useStore();

  const [view, setView] = useState<ViewMode>('weekly');
  const [weekAnchor, setWeekAnchor] = useState(() => dayjs().startOf('week'));
  const [currentMonth, setCurrentMonth] = useState(() => dayjs().startOf('month'));
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timelineDraft, setTimelineDraft] = useState<{ startTime: string; endTime: string } | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  // Prayer view state
  const [showFormFor, setShowFormFor] = useState<string | null>(null);
  const [showTimeEditor, setShowTimeEditor] = useState(false);
  const [editTimes, setEditTimes] = useState<Record<string, string>>({});
  const geoResolvedRef = useRef(false);

  // Deep-link: /planner?view=prayer opens straight into the Prayer tab
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const v = new URLSearchParams(window.location.search).get('view');
    if (v === 'prayer') setView('prayer');
  }, []);

  // Derived week range (stable strings for deps)
  const weekStartStr = weekAnchor.startOf('week').format('YYYY-MM-DD');
  const weekEndStr = weekAnchor.endOf('week').format('YYYY-MM-DD');
  const weekStart = dayjs(weekStartStr);
  const weekEnd = dayjs(weekEndStr);
  const monthStr = currentMonth.format('YYYY-MM');

  const loadData = () => {
    if (view === 'daily' || view === 'prayer') {
      fetchPlans(plannerDate);
    } else if (view === 'weekly') {
      fetchWeeklyPlans(weekStartStr);
    } else {
      fetchMonthlyPlans(monthStr);
    }
    fetchPlansSummary();
  };

  useEffect(() => {
    if (view === 'daily' || view === 'prayer') {
      fetchPlans(plannerDate);
    } else if (view === 'weekly') {
      fetchWeeklyPlans(weekStartStr);
    } else {
      fetchMonthlyPlans(monthStr);
    }
    fetchPlansSummary();
  }, [view, plannerDate, weekStartStr, monthStr, fetchPlans, fetchWeeklyPlans, fetchMonthlyPlans, fetchPlansSummary]);

  // Prayer times + day record — only fetched once the Prayer tab is opened
  // (geolocation prompt shouldn't fire for users who never use this view).
  useEffect(() => {
    if (view !== 'prayer' || !plannerDate) return;
    void fetchDayRecord(plannerDate);

    if (geoResolvedRef.current) {
      fetchPrayerTimes(plannerDate);
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          geoResolvedRef.current = true;
          fetchPrayerTimesFromLocation(plannerDate, pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          geoResolvedRef.current = true;
          fetchPrayerTimes(plannerDate);
        },
        { timeout: 8000, maximumAge: 300_000 }
      );
    } else {
      geoResolvedRef.current = true;
      fetchPrayerTimes(plannerDate);
    }
  }, [view, plannerDate, fetchDayRecord, fetchPrayerTimes, fetchPrayerTimesFromLocation]);

  // When switching to daily from weekly, jump to that week's Monday
  const switchView = (v: ViewMode) => {
    setView(v);
    if (v === 'daily') {
      // keep plannerDate as-is
    }
  };

  // --- Handlers ---
  const handleCreate = async (data: Parameters<typeof createPlan>[0]) => {
    await createPlan(data);
    setShowForm(false);
    setTimelineDraft(null);
    loadData();
  };

  const handleUpdate = async (data: Parameters<typeof updatePlan>[1]) => {
    if (!editingPlan) return;
    await updatePlan(editingPlan, data);
    setEditingPlan(null);
    setTimelineDraft(null);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: 'Delete plan', message: 'This plan will be permanently removed. This action cannot be undone.' }))) return;
    await deletePlan(id);
    loadData();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updatePlan(id, { status: newStatus });
    loadData();
  };

  // --- Prayer handlers ---
  const handleCreatePrayerPlan = async (prayerBlock: string, data: Parameters<typeof createPlan>[0]) => {
    await createPlan({ ...data, prayerBlock, startDate: plannerDate });
    setShowFormFor(null);
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

  const handlePrayerPerformed = async (prayer: string, checked: boolean) => {
    await updateDayRecord(plannerDate, { [prayer]: checked } as Record<string, boolean>);
  };

  // --- Filtering ---
  const filteredPlans = useMemo(() => {
    const seenOccurrences = new Set<string>();

    return plans.filter(p => {
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q)) return false;
      }

      const occurrenceKey = p.occurrenceKey || `${p.id}:${p.occurrenceDate || p.startDate}`;
      if (seenOccurrences.has(occurrenceKey)) return false;
      seenOccurrences.add(occurrenceKey);

      return true;
    });
  }, [plans, filterStatus, searchQuery]);

  const plansByDate = useMemo(() => filteredPlans.reduce<Record<string, typeof plans>>((acc, plan) => {
    const key = plan.occurrenceDate || plan.startDate;
    if (!acc[key]) acc[key] = [];
    acc[key].push(plan);
    return acc;
  }, {}), [filteredPlans]);

  // Group today's plans by prayer block (uses the full unfiltered set for the day)
  const plansByPrayer = useMemo(() => {
    const groups: Record<string, typeof plans> = {
      fajr: [], dhuhr: [], asr: [], maghrib: [], isha: [], unassigned: [],
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

  const currentPrayer = useMemo(() => {
    if (!prayerTimes) return null;
    const now = dayjs().format('HH:mm');
    const isToday = plannerDate === dayjs().format('YYYY-MM-DD');
    if (!isToday) return null;

    const prayers = PRAYER_ORDER.map((name) => ({ name, time: prayerTimes[name] }));
    let current = null;
    for (let i = 0; i < prayers.length; i++) {
      const nextPrayer = prayers[i + 1];
      if (now >= prayers[i].time && (!nextPrayer || now < nextPrayer.time)) {
        current = prayers[i].name;
        break;
      }
    }
    if (!current && now >= prayers[prayers.length - 1].time) {
      current = prayers[prayers.length - 1].name;
    }
    return current;
  }, [prayerTimes, plannerDate]);

  const nextPrayer = (() => {
    if (!prayerTimes) return null;
    const now = dayjs().format('HH:mm');
    const isToday = plannerDate === dayjs().format('YYYY-MM-DD');
    if (!isToday) return null;

    for (const name of PRAYER_ORDER) {
      if (now < prayerTimes[name]) return { name, time: prayerTimes[name] };
    }
    return null;
  })();

  const allPrayersPerformed = dayRecord &&
    dayRecord.fajr && dayRecord.dhuhr && dayRecord.asr && dayRecord.maghrib && dayRecord.isha;

  const editPlanData = editingPlan ? plans.find(p => p.id === editingPlan) : null;

  // Timeline events for daily view
  const timelineEvents: TimelineEvent[] = useMemo(() => filteredPlans.map(p => ({
    id: p.id,
    occurrenceKey: p.occurrenceKey || `${p.id}:${p.occurrenceDate || p.startDate}`,
    title: p.title,
    status: p.status,
    priority: p.priority,
    category: p.category,
    prayerBlock: p.prayerBlock,
    startTime: p.startTime,
    endTime: p.endTime,
  })), [filteredPlans]);

  // Timeline handlers
  const handleTimelineCreate = (startTime: string, endTime: string) => {
    setTimelineDraft({ startTime, endTime });
    setEditingPlan(null);
    setShowForm(true);
  };

  const handleTimelineMove = async (id: string, startTime: string, endTime: string) => {
    await updatePlan(id, { startTime, endTime });
    loadData();
  };

  const handleTimelineResize = async (id: string, startTime: string, endTime: string) => {
    await updatePlan(id, { startTime, endTime });
    loadData();
  };

  const handleTimelineSelect = (id: string) => {
    setEditingPlan(id);
    setShowForm(false);
    setTimelineDraft(null);
  };
  const today = dayjs().format('YYYY-MM-DD');
  const isToday = plannerDate === today;

  // --- Nav helpers ---
  const goWeekPrev = () => setWeekAnchor(a => a.subtract(1, 'week'));
  const goWeekNext = () => setWeekAnchor(a => a.add(1, 'week'));
  const goWeekToday = () => setWeekAnchor(dayjs().startOf('week'));
  const isCurrentWeek = weekStart.format('YYYY-MM-DD') === dayjs().startOf('week').format('YYYY-MM-DD');

  const dateSubtitle =
    view === 'weekly' ? `${weekStart.format('MMM D')} – ${weekEnd.format('MMM D, YYYY')}` :
    view === 'monthly' ? currentMonth.format('MMMM YYYY') :
    dayjs(plannerDate).format('dddd, MMM D');

  const handleExportPlans = () => {
    downloadCsv(
      `plans-${dayjs().format('YYYY-MM-DD')}.csv`,
      filteredPlans.map((p) => ({
        date: p.occurrenceDate || p.startDate,
        title: p.title,
        status: p.status,
        priority: p.priority,
        category: p.category || '',
        prayerBlock: p.prayerBlock || '',
        startTime: p.startTime || '',
        endTime: p.endTime || '',
      }))
    );
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {ConfirmDialog}

      {/* ── Header ── */}
      <PageHeader
        title="Planner"
        eyebrow="system/planner"
        description={dateSubtitle}
        actions={
          <>
            <Button variant="secondary" icon="download" onClick={handleExportPlans} disabled={filteredPlans.length === 0}>
              Export CSV
            </Button>
            <Button variant="primary" icon="add" onClick={() => { setShowForm(true); setEditingPlan(null); }} id="new-plan-btn">
              New plan
            </Button>
          </>
        }
      />

      {/* ── Summary Stats ── */}
      {plansSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Today" value={plansSummary.todayCount} subtitle={`${plansSummary.todayCompleted} done`} icon="today" variant="primary" />
          <StatCard label="This week" value={plansSummary.weekCount} subtitle={`${plansSummary.weekCompleted} done`} icon="date_range" />
          <StatCard label="This month" value={plansSummary.monthCount} subtitle={`${plansSummary.monthCompleted} done`} icon="calendar_month" />
          <StatCard label="Overdue" value={plansSummary.overdueCount} subtitle={`${plansSummary.upcomingCount} upcoming`} icon="warning" variant="warning" />
        </div>
      )}

      {/* ── Controls Bar ── */}
      <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-3 flex flex-wrap gap-4 items-center divide-x divide-outline-variant/10">

        {/* View Tabs */}
        <div className="flex gap-0.5 bg-surface-container-lowest rounded-sm p-0.5 border border-outline-variant/10">
          {(['daily', 'weekly', 'monthly', 'prayer'] as const).map(v => (
            <button
              key={v}
              onClick={() => switchView(v)}
              className={`px-3 py-1.5 text-xs font-label capitalize rounded-[2px] transition-all flex items-center gap-1 ${
                view === v
                  ? 'bg-primary/20 text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              id={`view-${v}`}
            >
              {v === 'prayer' && <span className="material-symbols-outlined text-[14px]">mosque</span>}
              {v}
            </button>
          ))}
        </div>

        {/* Date / Week / Month Navigation */}
        <div className="flex items-center gap-2 pl-4">
          {(view === 'daily' || view === 'prayer') && (
            <>
              <button onClick={() => setPlannerDate(dayjs(plannerDate).subtract(1, 'day').format('YYYY-MM-DD'))} className="text-on-surface-variant hover:text-primary transition-colors p-1">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <input
                type="date"
                value={plannerDate}
                onChange={e => setPlannerDate(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant/15 rounded-sm px-2 py-1 text-xs font-mono text-on-surface"
              />
              <button onClick={() => setPlannerDate(dayjs(plannerDate).add(1, 'day').format('YYYY-MM-DD'))} className="text-on-surface-variant hover:text-primary transition-colors p-1">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              {plannerDate !== today && (
                <button onClick={() => setPlannerDate(today)} className="text-xs text-on-surface-variant hover:text-primary transition-colors">
                  Today
                </button>
              )}
            </>
          )}

          {view === 'weekly' && (
            <>
              <button onClick={goWeekPrev} className="text-on-surface-variant hover:text-primary transition-colors p-1" id="week-prev">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span className="font-headline text-xs font-semibold text-on-surface min-w-[160px] text-center">
                {weekStart.format('MMM D')} – {weekEnd.format('MMM D')}
              </span>
              <button onClick={goWeekNext} className="text-on-surface-variant hover:text-primary transition-colors p-1" id="week-next">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              {!isCurrentWeek && (
                <button onClick={goWeekToday} className="text-xs text-on-surface-variant hover:text-primary transition-colors">
                  This week
                </button>
              )}
            </>
          )}

          {view === 'monthly' && (
            <>
              <button onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))} className="text-on-surface-variant hover:text-primary transition-colors p-1">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span className="font-headline text-xs font-semibold text-on-surface min-w-[120px] text-center">
                {currentMonth.format('MMM YYYY')}
              </span>
              <button onClick={() => setCurrentMonth(m => m.add(1, 'month'))} className="text-on-surface-variant hover:text-primary transition-colors p-1">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </>
          )}
        </div>

        {/* Search + Status Filter (not shown for the Prayer view) */}
        {view !== 'prayer' && (
          <div className="flex items-center gap-2 w-full sm:w-auto pl-4">
            <div className="relative flex-1 min-w-[180px]">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[14px] text-outline">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-sm pl-7 pr-3 py-1.5 text-xs font-body text-on-surface placeholder:text-outline focus:border-primary/50 transition-colors"
              />
            </div>
            <Select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-auto py-1.5 text-xs"
            >
              <option value="all">All statuses</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Done</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
        )}

        {/* Prayer times source (Prayer view only) */}
        {view === 'prayer' && (
          <div className="flex items-center gap-4 pl-4">
            {nextPrayer && (
              <div className="text-right">
                <div className="text-xs text-on-surface-variant/70">Next prayer</div>
                <div className="font-headline text-sm font-semibold text-primary">
                  {PRAYER_LABELS[nextPrayer.name]} <span className="text-xs text-on-surface-variant">{nextPrayer.time}</span>
                </div>
              </div>
            )}
            <div className="text-right">
              <div className="text-xs text-on-surface-variant/70">Source</div>
              <div className="text-xs flex items-center gap-1 justify-end">
                {isPrayerTimesLoading ? (
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
                    fajr: prayerTimes.fajr, dhuhr: prayerTimes.dhuhr, asr: prayerTimes.asr,
                    maghrib: prayerTimes.maghrib, isha: prayerTimes.isha,
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
        )}
      </div>

      {/* ── Form (Create / Edit) ── */}
      {showForm && (
        <PlanForm
          onSubmit={handleCreate}
          onCancel={() => { setShowForm(false); setTimelineDraft(null); }}
          initialData={{
            startDate: plannerDate,
            ...(timelineDraft ? { startTime: timelineDraft.startTime, endTime: timelineDraft.endTime } : {}),
          }}
        />
      )}
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
            lifeArea: editPlanData.lifeArea || null,
            notes: editPlanData.notes || '',
            startDate: editPlanData.startDate,
            startTime: editPlanData.startTime,
            endDate: editPlanData.endDate || '',
            endTime: editPlanData.endTime,
            dayOfWeek: editPlanData.dayOfWeek,
            prayerBlock: editPlanData.prayerBlock,
          }}
        />
      )}

      {/* ── Main Content ── */}
      {isPlansLoading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-on-surface-variant font-mono text-sm">
          <span className="animate-blink text-primary text-xl">▊</span>
          Loading plans...
        </div>
      ) : (
        <>
          {/* DAILY VIEW */}
          {view === 'daily' && (
            <div className="space-y-4">
              {/* Timeline header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-on-surface">
                  Timeline — {dayjs(plannerDate).format('ddd, MMM D YYYY')}
                </span>
                <span className="text-xs text-on-surface-variant/70">
                  {filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''} · drag to add
                </span>
              </div>

              {/* Day Timeline */}
              <DayTimeline
                date={plannerDate}
                events={timelineEvents}
                onCreateSlot={handleTimelineCreate}
                onMoveEvent={handleTimelineMove}
                onResizeEvent={handleTimelineResize}
                onSelectEvent={handleTimelineSelect}
                onDeleteEvent={handleDelete}
              />

              {/* Plan cards list below timeline */}
              {filteredPlans.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-on-surface">Plan list</span>
                  <div className="flex flex-col gap-2">
                    {filteredPlans.map(plan => (
                      <PlanCard
                        key={plan.occurrenceKey || plan.id}
                        {...plan}
                        onStatusChange={handleStatusChange}
                        onEdit={id => { setEditingPlan(id); setShowForm(false); }}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* WEEKLY VIEW */}
          {view === 'weekly' && (
            <div className="space-y-3">
              {/* Week summary bar */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-on-surface">
                  Week {weekStart.isoWeek()} — {weekStart.format('MMM D')} to {weekEnd.format('MMM D, YYYY')}
                </span>
                <span className="text-xs text-on-surface-variant/70">{filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''}</span>
              </div>

              {/* 7-day grid */}
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, i) => {
                  const day = weekStart.add(i, 'day');
                  const dayStr = day.format('YYYY-MM-DD');
                  const dayPlans = plansByDate[dayStr] || [];
                  const isTodayCell = dayStr === today;
                  const completedCount = dayPlans.filter(p => p.status === 'completed').length;

                  return (
                    <div
                      key={dayStr}
                      className={`rounded-md border flex flex-col min-h-[160px] transition-colors ${
                        isTodayCell
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-outline-variant/15 bg-surface-container-lowest'
                      }`}
                    >
                      {/* Day header — click to drill into daily */}
                      <button
                        onClick={() => { setPlannerDate(dayStr); setWeekAnchor(day.startOf('week')); switchView('daily'); }}
                        className={`flex items-center justify-between px-3 py-2 border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors rounded-t-md ${
                          isTodayCell ? 'border-primary/20' : ''
                        }`}
                        title={`View ${day.format('ddd D')}`}
                      >
                        <span className={`font-label text-xs font-semibold ${isTodayCell ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {DAY_NAMES[i]}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {dayPlans.length > 0 && (
                            <span className="text-xs text-on-surface-variant/60">{completedCount}/{dayPlans.length}</span>
                          )}
                          <span className={`font-headline text-xs font-semibold ${isTodayCell ? 'text-primary' : 'text-on-surface'}`}>
                            {day.format('D')}
                          </span>
                        </div>
                      </button>

                      {/* Plans list */}
                      <div className="flex flex-col gap-1 p-2 flex-1">
                        {dayPlans.length === 0 ? (
                          <span className="text-xs text-on-surface-variant/40 text-center mt-6">Nothing planned</span>
                        ) : (
                          dayPlans.map(plan => (
                            <PlanCard
                              key={plan.occurrenceKey || plan.id}
                              {...plan}
                              compact
                              onStatusChange={handleStatusChange}
                              onEdit={id => { setEditingPlan(id); setShowForm(false); }}
                              onDelete={handleDelete}
                            />
                          ))
                        )}
                      </div>

                      {/* Quick-add for this day */}
                      <button
                        onClick={() => { setPlannerDate(dayStr); setShowForm(true); setEditingPlan(null); }}
                        className="flex items-center justify-center gap-1 py-1.5 text-xs font-label text-on-surface-variant/60 hover:text-primary hover:bg-surface-container-low/30 transition-colors rounded-b-md border-t border-outline-variant/10"
                        title={`Add plan for ${day.format('ddd D')}`}
                      >
                        <span className="material-symbols-outlined text-[12px]">add</span>
                        Add
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MONTHLY VIEW */}
          {view === 'monthly' && (
            <div className="space-y-3">
              <span className="text-sm font-medium text-on-surface">
                {currentMonth.format('MMMM YYYY')} — {filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''}
              </span>
              <div className="bg-surface-container-lowest rounded-md border border-outline-variant/15 overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-outline-variant/15">
                  {DAY_NAMES.map(d => (
                    <div key={d} className="py-2.5 text-center font-label text-xs text-on-surface-variant/70">{d}</div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7">
                  {Array.from({ length: currentMonth.startOf('month').day() }).map((_, i) => (
                    <div key={`e-${i}`} className="border-b border-r border-outline-variant/15 min-h-[80px]" />
                  ))}
                  {Array.from({ length: currentMonth.daysInMonth() }).map((_, i) => {
                    const day = currentMonth.date(i + 1);
                    const dateStr = day.format('YYYY-MM-DD');
                    const dayPlans = plansByDate[dateStr] || [];
                    const isTodayCell = dateStr === today;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => { setPlannerDate(dateStr); setWeekAnchor(day.startOf('week')); switchView('daily'); }}
                        className={`border-b border-r border-outline-variant/15 min-h-[80px] p-1.5 text-left flex flex-col transition-colors hover:bg-surface-container-low ${
                          isTodayCell ? 'bg-primary/8 ring-1 ring-inset ring-primary/30' : ''
                        }`}
                      >
                        <span className={`font-headline text-xs font-semibold mb-1 ${isTodayCell ? 'text-primary' : 'text-on-surface'}`}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                          {dayPlans.slice(0, 3).map(p => (
                            <div key={p.occurrenceKey || p.id} className={`text-[7px] font-label truncate px-1 py-0.5 rounded-[1px] ${
                              p.status === 'completed' ? 'bg-primary/20 text-primary' :
                              p.status === 'in_progress' ? 'bg-tertiary/20 text-tertiary' :
                              p.status === 'cancelled' ? 'bg-error/15 text-error' :
                              'bg-secondary/10 text-secondary'
                            }`}>
                              {p.title}
                            </div>
                          ))}
                          {dayPlans.length > 3 && (
                            <span className="text-[7px] text-outline font-mono">+{dayPlans.length - 3} more</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* PRAYER VIEW */}
          {view === 'prayer' && (
            <div className="space-y-4">
              {/* All Prayers Complete Banner */}
              {isToday && allPrayersPerformed && (
                <div className="border border-primary/40 bg-primary/5 rounded-sm px-4 py-3 flex items-center gap-2 animate-fade-in">
                  <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>mosque</span>
                  <span className="text-sm text-primary font-medium">All prayers complete — worship layer secured ✓</span>
                </div>
              )}

              {/* Prayer Time Editor */}
              {showTimeEditor && (
                <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-md p-5 animate-fade-in">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="font-headline text-sm font-semibold text-on-surface">Prayer times</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {PRAYER_ORDER.map(prayer => (
                      <div key={prayer}>
                        <label className="text-xs text-on-surface-variant/80 block mb-1">
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
                    <Button variant="ghost" onClick={() => setShowTimeEditor(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSaveTimes}>Save times</Button>
                  </div>
                </div>
              )}

              {/* Prayer Blocks */}
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
                              <h3 className="font-headline text-sm font-semibold text-on-surface">
                                {PRAYER_LABELS[prayer]}
                              </h3>
                              {isActive && (
                                <span className="px-1.5 py-0.5 rounded-[2px] bg-primary/20 text-[10px] text-primary font-medium">
                                  Active
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-on-surface-variant/80">{prayerTime}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-on-surface-variant/70">
                            {completed}/{prayerPlans.length} done
                          </span>
                          {dayRecord && prayerToField[prayer] !== undefined && (
                            <button
                              onClick={() => handlePrayerPerformed(prayer, !Boolean(dayRecord[prayerToField[prayer]]))}
                              className={`flex items-center gap-1 px-2 py-1 rounded-sm border text-xs transition-all ${
                                dayRecord[prayerToField[prayer]]
                                  ? 'border-primary/40 bg-primary/10 text-primary'
                                  : 'border-outline-variant/20 bg-transparent text-on-surface-variant hover:border-primary/30'
                              }`}
                              title="Mark prayer as performed"
                            >
                              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: dayRecord[prayerToField[prayer]] ? "'FILL' 1" : "'FILL' 0" }}>
                                mosque
                              </span>
                              {dayRecord[prayerToField[prayer]] ? 'Performed ✓' : 'Mark done'}
                            </button>
                          )}
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
                            onSubmit={(data) => handleCreatePrayerPlan(prayer, data)}
                            onCancel={() => setShowFormFor(null)}
                            initialData={{ startDate: plannerDate, prayerBlock: prayer }}
                          />
                        </div>
                      )}

                      {/* Plans list */}
                      <div className="bg-surface-container-lowest">
                        {prayerPlans.length === 0 ? (
                          <div className="px-4 py-2.5">
                            <span className="text-xs text-on-surface-variant/50">No plans yet — use + to add one.</span>
                          </div>
                        ) : (
                          <div className="p-3">
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
                                    lifeArea={plan.lifeArea}
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
                                      className="bg-surface-container-high border border-outline-variant/15 rounded-sm px-1 py-0.5 text-xs font-label text-on-surface-variant cursor-pointer"
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
                          <h3 className="font-headline text-sm font-semibold text-on-surface-variant">
                            Unassigned
                          </h3>
                          <span className="text-xs text-on-surface-variant/60">No prayer block</span>
                        </div>
                      </div>
                      <span className="text-xs text-on-surface-variant/70">
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
                                className="bg-surface-container-high border border-outline-variant/15 rounded-sm px-1 py-0.5 text-xs font-label text-on-surface-variant cursor-pointer"
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
