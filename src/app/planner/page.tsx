'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import SectionHeader from '@/components/ui/SectionHeader';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import PlanCard from '@/components/planner/PlanCard';
import PlanForm from '@/components/planner/PlanForm';
import dayjs from 'dayjs';

type ViewMode = 'daily' | 'weekly' | 'monthly' | 'overview';

export default function PlannerPage() {
  const {
    plans, plansSummary, isPlansLoading,
    fetchPlans, fetchWeeklyPlans, fetchMonthlyPlans, fetchPlansSummary,
    createPlan, updatePlan, deletePlan,
    plannerDate, setPlannerDate,
  } = useStore();

  const [view, setView] = useState<ViewMode>('daily');
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  // Load data based on view
  const loadData = useCallback(() => {
    switch (view) {
      case 'daily':
        fetchPlans(plannerDate);
        break;
      case 'weekly':
        fetchWeeklyPlans(plannerDate);
        break;
      case 'monthly':
        fetchMonthlyPlans(currentMonth.format('YYYY-MM'));
        break;
      case 'overview':
        fetchPlans(plannerDate);
        break;
    }
    fetchPlansSummary();
  }, [view, plannerDate, currentMonth, fetchPlans, fetchWeeklyPlans, fetchMonthlyPlans, fetchPlansSummary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (data: Parameters<typeof createPlan>[0]) => {
    await createPlan(data);
    setShowForm(false);
    loadData();
  };

  const handleUpdate = async (data: Parameters<typeof updatePlan>[1]) => {
    if (!editingPlan) return;
    await updatePlan(editingPlan, data);
    setEditingPlan(null);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    await deletePlan(id);
    setDeleteConfirm(null);
    loadData();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updatePlan(id, { status: newStatus });
    loadData();
  };

  const editPlanData = editingPlan ? plans.find(p => p.id === editingPlan) : null;

  // Filtering
  const filteredPlans = plans.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterCategory !== 'all' && (p.category || '').toLowerCase() !== filterCategory.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const categories = Array.from(new Set(plans.map(p => p.category).filter(Boolean)));

  // Group plans by date for weekly/monthly views
  const plansByDate = filteredPlans.reduce<Record<string, typeof plans>>((acc, plan) => {
    const key = plan.startDate;
    if (!acc[key]) acc[key] = [];
    acc[key].push(plan);
    return acc;
  }, {});

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <header>
        <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter text-on-surface mb-2">
          <span className="text-primary">&gt;</span> system/planner --mode={view}
        </h1>
        <p className="font-body text-on-surface-variant">
          Centralized planning and execution command center.
        </p>
      </header>

      {/* Summary Stats */}
      {plansSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="TODAY" value={plansSummary.todayCount} subtitle={`${plansSummary.todayCompleted} completed`} icon="today" variant="primary" />
          <StatCard label="THIS_WEEK" value={plansSummary.weekCount} subtitle={`${plansSummary.weekCompleted} completed`} icon="date_range" />
          <StatCard label="THIS_MONTH" value={plansSummary.monthCount} subtitle={`${plansSummary.monthCompleted} completed`} icon="calendar_month" />
          <StatCard label="OVERDUE" value={plansSummary.overdueCount} subtitle={`${plansSummary.upcomingCount} upcoming`} icon="warning" variant="warning" />
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-surface-container-low p-3 rounded-md border border-outline-variant/15">
        {/* View Tabs */}
        <div className="flex gap-1">
          {(['daily', 'weekly', 'monthly', 'overview'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-[10px] font-label uppercase tracking-widest rounded-sm transition-colors ${
                view === v
                  ? 'bg-primary/20 text-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Date Navigation */}
        {view === 'daily' && (
          <div className="flex items-center gap-3">
            <button onClick={() => setPlannerDate(dayjs(plannerDate).subtract(1, 'day').format('YYYY-MM-DD'))} className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <input
              type="date"
              value={plannerDate}
              onChange={(e) => setPlannerDate(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant/15 rounded-sm px-2 py-1 text-xs font-mono text-on-surface"
            />
            <button onClick={() => setPlannerDate(dayjs(plannerDate).add(1, 'day').format('YYYY-MM-DD'))} className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
            <button
              onClick={() => setPlannerDate(dayjs().format('YYYY-MM-DD'))}
              className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
            >
              Today
            </button>
          </div>
        )}

        {view === 'monthly' && (
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))} className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <span className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface min-w-[120px] text-center">
              {currentMonth.format('MMMM YYYY')}
            </span>
            <button onClick={() => setCurrentMonth(m => m.add(1, 'month'))} className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        )}

        {/* Add Plan Button */}
        <button
          onClick={() => { setShowForm(true); setEditingPlan(null); }}
          className="px-4 py-1.5 bg-scanline-gradient text-on-primary text-[10px] font-label uppercase font-bold rounded-sm hover:opacity-90 transition-opacity tracking-wider"
        >
          + New Plan
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-primary font-headline">&gt;</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plans..."
            className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-sm px-3 py-1.5 text-xs font-body text-on-surface placeholder:text-outline focus:border-primary/50 transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-surface-container-low border border-outline-variant/15 rounded-sm px-2 py-1.5 text-[10px] font-label text-on-surface-variant uppercase tracking-widest cursor-pointer"
        >
          <option value="all">ALL_STATUS</option>
          <option value="planned">PLANNED</option>
          <option value="in_progress">IN_PROGRESS</option>
          <option value="completed">COMPLETED</option>
          <option value="cancelled">CANCELLED</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-surface-container-low border border-outline-variant/15 rounded-sm px-2 py-1.5 text-[10px] font-label text-on-surface-variant uppercase tracking-widest cursor-pointer"
        >
          <option value="all">ALL_CATEGORIES</option>
          {categories.map(c => <option key={c!} value={c!}>{c}</option>)}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <PlanForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          initialData={{ startDate: plannerDate }}
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
            notes: editPlanData.notes || '',
            startDate: editPlanData.startDate,
            endDate: editPlanData.endDate || '',
            prayerBlock: editPlanData.prayerBlock,
          }}
        />
      )}

      {/* Content */}
      {isPlansLoading ? (
        <div className="flex items-center gap-2 py-8 justify-center font-mono text-sm text-on-surface-variant">
          <span className="animate-blink text-primary">▊</span> Loading plans...
        </div>
      ) : view === 'daily' || view === 'overview' ? (
        /* Daily / Overview View */
        <div className="space-y-3">
          <SectionHeader
            title={view === 'daily' ? `PLANS_${dayjs(plannerDate).format('MMM_DD').toUpperCase()}` : 'ALL_PLANS'}
            rightContent={`${filteredPlans.length} plans`}
          />
          {filteredPlans.length === 0 ? (
            <EmptyState title="No plans found" description="Create a new plan to get started." icon="event_note" />
          ) : (
            <div className="flex flex-col gap-2">
              {filteredPlans.map(plan => (
                <PlanCard
                  key={plan.id}
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
                  onStatusChange={handleStatusChange}
                  onEdit={(id) => { setEditingPlan(id); setShowForm(false); }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      ) : view === 'weekly' ? (
        /* Weekly View */
        <div className="space-y-4">
          <SectionHeader title="WEEKLY_PLANNER" rightContent={`Week of ${dayjs(plannerDate).startOf('week').format('MMM D')}`} />
          {(() => {
            const weekStart = dayjs(plannerDate).startOf('week');
            return (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, i) => {
                  const day = weekStart.add(i, 'day');
                  const dayStr = day.format('YYYY-MM-DD');
                  const dayPlans = (plansByDate[dayStr] || []);
                  const isToday = dayStr === dayjs().format('YYYY-MM-DD');

                  return (
                    <div
                      key={dayStr}
                      className={`bg-surface-container-lowest rounded-md border p-3 min-h-[140px] flex flex-col ${
                        isToday ? 'border-primary/40' : 'border-outline-variant/15'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-label text-[10px] uppercase tracking-widest ${isToday ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                          {dayNames[i]}
                        </span>
                        <span className={`font-headline text-xs font-semibold ${isToday ? 'text-primary' : 'text-on-surface'}`}>
                          {day.format('DD')}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 flex-1">
                        {dayPlans.length === 0 ? (
                          <span className="font-mono text-[9px] text-outline text-center mt-4">—</span>
                        ) : (
                          dayPlans.map(plan => (
                            <PlanCard
                              key={plan.id}
                              compact
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
                              onStatusChange={handleStatusChange}
                              onEdit={(id) => { setEditingPlan(id); setShowForm(false); }}
                              onDelete={handleDelete}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : (
        /* Monthly Calendar View */
        <div className="space-y-4">
          <SectionHeader title="MONTHLY_PLANNER" rightContent={currentMonth.format('MMMM YYYY')} />
          <div className="bg-surface-container-low rounded-md border border-outline-variant/15 overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-outline-variant/15">
              {dayNames.map(d => (
                <div key={d} className="py-2 text-center font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{d}</div>
              ))}
            </div>
            {/* Day Cells */}
            <div className="grid grid-cols-7">
              {Array.from({ length: currentMonth.startOf('month').day() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square border-b border-r border-outline-variant/10" />
              ))}
              {Array.from({ length: currentMonth.daysInMonth() }).map((_, i) => {
                const day = i + 1;
                const dateStr = currentMonth.date(day).format('YYYY-MM-DD');
                const dayPlans = plansByDate[dateStr] || [];
                const isToday = dateStr === dayjs().format('YYYY-MM-DD');
                const isSelected = dateStr === plannerDate;

                return (
                  <button
                    key={day}
                    onClick={() => { setPlannerDate(dateStr); setView('daily'); }}
                    className={`aspect-square border-b border-r border-outline-variant/10 p-1 text-left flex flex-col transition-colors ${
                      isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-surface-container-high'
                    }`}
                  >
                    <span className={`font-headline text-xs font-semibold ${
                      isToday ? 'text-primary' : 'text-on-surface'
                    }`}>
                      {String(day).padStart(2, '0')}
                    </span>
                    <div className="flex flex-col gap-0.5 mt-0.5 overflow-hidden flex-1">
                      {dayPlans.slice(0, 3).map(p => (
                        <div
                          key={p.id}
                          className={`text-[7px] font-label truncate px-0.5 rounded-[1px] ${
                            p.status === 'completed' ? 'bg-primary/20 text-primary' :
                            p.status === 'in_progress' ? 'bg-tertiary/20 text-tertiary' :
                            'bg-secondary/10 text-secondary'
                          }`}
                        >
                          {p.title}
                        </div>
                      ))}
                      {dayPlans.length > 3 && (
                        <span className="text-[7px] text-outline font-mono">+{dayPlans.length - 3}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-md p-6 max-w-sm mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide mb-2">
              <span className="text-error">&gt;</span> CONFIRM_DELETE
            </h3>
            <p className="font-body text-sm text-on-surface-variant mb-4">
              Are you sure you want to delete this plan? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-xs font-label uppercase text-on-surface-variant hover:text-on-surface transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-1.5 bg-error text-on-error text-xs font-label uppercase font-bold rounded-sm hover:opacity-90 transition-opacity">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
