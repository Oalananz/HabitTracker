'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import dayjs from 'dayjs';
import { LIFE_AREAS, isLifeAreaId, type LifeAreaId } from '@/lib/lifeAreas';
import LifeAreaBadge from '@/components/ui/LifeAreaBadge';
import LifeAreaSelect from '@/components/ui/LifeAreaSelect';
import AiGoalBreaker from '@/components/ai/AiGoalBreaker';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { useConfirm } from '@/components/ui/useConfirm';

type GoalTab = 'all' | 'weekly' | 'dated' | 'open';

export default function GoalsPage() {
  const {
    goals, isGoalsLoading,
    fetchGoals, createGoal, updateGoal, toggleGoalComplete, incrementGoal, deleteGoal,
  } = useStore();

  const [activeTab, setActiveTab] = useState<GoalTab>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'weekly' | 'dated' | 'open'>('open');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newTargetCount, setNewTargetCount] = useState(1);
  const [newLifeArea, setNewLifeArea] = useState<LifeAreaId | null>(null);
  const [filterArea, setFilterArea] = useState<'all' | LifeAreaId>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [showBreaker, setShowBreaker] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    fetchGoals(activeTab === 'all' ? undefined : activeTab);
  }, [fetchGoals, activeTab]);

  // Deep-link: /goals?area=health preselects the area + opens the create form
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const area = new URLSearchParams(window.location.search).get('area');
    if (area && isLifeAreaId(area)) {
      setFilterArea(area);
      setNewLifeArea(area);
      setShowCreate(true);
    }
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createGoal({
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      goalType: newType,
      targetDate: newType === 'dated' ? newTargetDate : undefined,
      targetCount: newTargetCount,
      lifeArea: newLifeArea,
    });
    setNewTitle('');
    setNewDesc('');
    setNewType('open');
    setNewTargetDate('');
    setNewTargetCount(1);
    setNewLifeArea(null);
    setShowCreate(false);
  };

  const visibleGoals = goals
    .filter((g) => filterArea === 'all' || g.lifeArea === filterArea)
    .filter((g) => (showArchived ? g.isActive === false : g.isActive !== false));
  const archivedCount = goals.filter((g) => g.isActive === false).length;

  const tabs: { key: GoalTab; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: 'apps' },
    { key: 'weekly', label: 'Weekly', icon: 'date_range' },
    { key: 'dated', label: 'By Date', icon: 'event' },
    { key: 'open', label: 'Open', icon: 'all_inclusive' },
  ];

  const getStatusColor = (goal: typeof goals[0]) => {
    if (goal.completed) return 'text-primary';
    if (goal.goalType === 'dated' && goal.targetDate) {
      const diff = dayjs(goal.targetDate).diff(dayjs(), 'day');
      if (diff < 0) return 'text-error';
      if (diff <= 3) return 'text-tertiary';
    }
    return 'text-on-surface-variant';
  };

  const getStatusLabel = (goal: typeof goals[0]) => {
    if (goal.completed) return 'Completed';
    if (goal.goalType === 'dated' && goal.targetDate) {
      const diff = dayjs(goal.targetDate).diff(dayjs(), 'day');
      if (diff < 0) return `Overdue ${Math.abs(diff)}d`;
      if (diff === 0) return 'Due today';
      return `${diff}d left`;
    }
    if (goal.goalType === 'weekly') return 'This week';
    return 'In progress';
  };

  const isOverdue = (goal: typeof goals[0]) =>
    !goal.completed && goal.goalType === 'dated' && !!goal.targetDate && dayjs(goal.targetDate).diff(dayjs(), 'day') < 0;

  const overdueGoals = visibleGoals.filter((g) => isOverdue(g));
  const activeGoals = visibleGoals.filter((g) => !g.completed && !isOverdue(g));
  const completedGoals = visibleGoals.filter((g) => g.completed);

  return (
    <div className="space-y-8 animate-page-enter">
        {ConfirmDialog}
        <PageHeader
          title="Goals"
          eyebrow="system/goals"
          description="Set targets. Track progress. Achieve milestones."
          actions={
            <>
              <Button variant="secondary" icon="auto_awesome" onClick={() => setShowBreaker((v) => !v)}>
                AI Breaker
              </Button>
              <Button variant="primary" icon="add" onClick={() => setShowCreate(!showCreate)} id="create-goal-btn">
                New Goal
              </Button>
            </>
          }
        />

        {/* AI Goal Breaker (toggle) */}
        {showBreaker && (
          <AiGoalBreaker
            key={`breaker-${newTitle}`}
            initialTitle={newTitle}
            initialDescription={newDesc}
            initialLifeArea={newLifeArea}
          />
        )}

        {/* Create Goal Form */}
        {showCreate && (
          <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 animate-fade-in space-y-4">
            <h3 className="font-headline text-sm font-semibold text-on-surface">New goal</h3>

            {/* Goal Type Selector */}
            <div>
              <label className="text-xs text-on-surface-variant/80 block mb-2">Goal type</label>
              <div className="flex gap-2">
                {(['weekly', 'dated', 'open'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewType(type)}
                    className={`px-4 py-2 rounded-sm font-label text-sm capitalize transition-colors ${
                      newType === type
                        ? 'bg-primary text-on-primary font-semibold'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-bright'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-on-surface-variant/80 block mb-1.5">Title</label>
                <Input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Read 3 books, Exercise 4x, Ship feature"
                  id="goal-title"
                />
              </div>

              {newType === 'dated' && (
                <div>
                  <label className="text-xs text-on-surface-variant/80 block mb-1.5">Target date</label>
                  <Input
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    id="goal-target-date"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-on-surface-variant/80 block mb-1.5">Target count</label>
                <Input
                  type="number"
                  min={1}
                  value={newTargetCount}
                  onChange={(e) => setNewTargetCount(parseInt(e.target.value) || 1)}
                  id="goal-target-count"
                />
              </div>

              <LifeAreaSelect value={newLifeArea} onChange={setNewLifeArea} id="goal-life-area" />
            </div>

            <div>
              <label className="text-xs text-on-surface-variant/80 block mb-1.5">Description (optional)</label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                placeholder="Details about this goal..."
                id="goal-desc"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="primary" onClick={handleCreate} disabled={!newTitle.trim()}>
                Create goal
              </Button>
              <Button
                variant="secondary"
                icon="auto_awesome"
                onClick={() => { if (newTitle.trim()) setShowBreaker(true); }}
                disabled={!newTitle.trim()}
              >
                Break with AI
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-container-lowest rounded-sm p-1 border border-outline-variant/15">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm font-label text-sm transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Life Area filter */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterArea('all')}
            className={`px-3 py-1.5 rounded-sm text-xs transition-colors border ${
              filterArea === 'all'
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/15 hover:text-on-surface'
            }`}
          >
            All
          </button>
          {LIFE_AREAS.map((area) => (
            <button
              key={area.id}
              onClick={() => setFilterArea(area.id)}
              className="px-3 py-1.5 rounded-sm text-xs transition-colors border"
              style={
                filterArea === area.id
                  ? { color: area.color, backgroundColor: `${area.color}1a`, borderColor: `${area.color}55` }
                  : { borderColor: 'rgba(255,255,255,0.08)' }
              }
            >
              {area.shortLabel}
            </button>
          ))}
          {archivedCount > 0 && (
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={`ml-auto px-3 py-1.5 rounded-sm text-xs transition-colors border ${
                showArchived ? 'bg-tertiary/10 text-tertiary border-tertiary/30' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/15 hover:text-on-surface'
              }`}
            >
              {showArchived ? `Active goals` : `Archived (${archivedCount})`}
            </button>
          )}
        </div>

        {/* Goals List */}
        {isGoalsLoading ? (
          <div className="flex items-center gap-2 py-16 justify-center font-mono text-sm text-on-surface-variant">
            <span className="animate-blink text-primary">▊</span> Loading goals...
          </div>
        ) : visibleGoals.length === 0 ? (
          <EmptyState icon="flag" title="No goals found" description={'Click "New goal" to set a target.'} />
        ) : showArchived ? (
          <div className="space-y-2">
            {visibleGoals.map((goal) => (
              <GoalRow
                key={goal.id}
                goal={goal}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                toggleGoalComplete={toggleGoalComplete}
                incrementGoal={incrementGoal}
                updateGoal={updateGoal}
                deleteGoal={deleteGoal}
                confirm={confirm}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {overdueGoals.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-error/80">Overdue ({overdueGoals.length})</div>
                {overdueGoals.map((goal) => (
                  <GoalRow
                    key={goal.id}
                    goal={goal}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    toggleGoalComplete={toggleGoalComplete}
                    incrementGoal={incrementGoal}
                    updateGoal={updateGoal}
                    deleteGoal={deleteGoal}
                    confirm={confirm}
                    getStatusColor={getStatusColor}
                    getStatusLabel={getStatusLabel}
                  />
                ))}
              </div>
            )}
            {activeGoals.length > 0 && (
              <div className="space-y-2">
                {overdueGoals.length > 0 && <div className="text-xs font-medium text-on-surface-variant/70">Active ({activeGoals.length})</div>}
                {activeGoals.map((goal) => (
                  <GoalRow
                    key={goal.id}
                    goal={goal}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    toggleGoalComplete={toggleGoalComplete}
                    incrementGoal={incrementGoal}
                    updateGoal={updateGoal}
                    deleteGoal={deleteGoal}
                    confirm={confirm}
                    getStatusColor={getStatusColor}
                    getStatusLabel={getStatusLabel}
                  />
                ))}
              </div>
            )}
            {completedGoals.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-primary/80">Completed ({completedGoals.length})</div>
                {completedGoals.map((goal) => (
                  <GoalRow
                    key={goal.id}
                    goal={goal}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    toggleGoalComplete={toggleGoalComplete}
                    incrementGoal={incrementGoal}
                    updateGoal={updateGoal}
                    deleteGoal={deleteGoal}
                    confirm={confirm}
                    getStatusColor={getStatusColor}
                    getStatusLabel={getStatusLabel}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
  );
}

type GoalItem = {
  id: string;
  title: string;
  description: string | null;
  goalType: 'weekly' | 'dated' | 'open';
  targetDate: string | null;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  completedAt: string | null;
  lifeArea?: string | null;
  isActive: boolean;
  createdAt: string;
};

function GoalRow({
  goal, openMenuId, setOpenMenuId, toggleGoalComplete, incrementGoal, updateGoal, deleteGoal, confirm, getStatusColor, getStatusLabel,
}: {
  goal: GoalItem;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  toggleGoalComplete: (id: string) => void;
  incrementGoal: (id: string) => void;
  updateGoal: (id: string, data: { isActive?: boolean }) => void;
  deleteGoal: (id: string) => void;
  confirm: (opts: { message: string }) => Promise<boolean>;
  getStatusColor: (goal: GoalItem) => string;
  getStatusLabel: (goal: GoalItem) => string;
}) {
  const progress = goal.targetCount > 0
    ? Math.min((goal.currentCount / goal.targetCount) * 100, 100)
    : 0;
  const menuOpen = openMenuId === goal.id;

  return (
    <div
      className={`bg-surface-container-low rounded-md border p-4 transition-all ${
        goal.completed
          ? 'border-primary/20 opacity-75'
          : 'border-outline-variant/15'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Checkbox + Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={() => toggleGoalComplete(goal.id)}
            className={`mt-0.5 w-5 h-5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              goal.completed
                ? 'bg-primary border-primary'
                : 'border-outline-variant/40 hover:border-primary/60'
            }`}
          >
            {goal.completed && (
              <span className="material-symbols-outlined text-[14px] text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                check
              </span>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-headline text-sm font-semibold ${goal.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                {goal.title}
              </h3>
              <LifeAreaBadge lifeArea={goal.lifeArea} />
            </div>
            {goal.description && (
              <p className="font-body text-xs text-on-surface-variant mt-1 truncate">{goal.description}</p>
            )}

            {/* Progress bar for quantifiable goals */}
            {goal.targetCount > 1 && (
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-scanline-gradient rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-on-surface-variant whitespace-nowrap">
                  {goal.currentCount}/{goal.targetCount}
                </span>
                {!goal.completed && (
                  <button
                    onClick={() => incrementGoal(goal.id)}
                    className="w-6 h-6 rounded-sm bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Meta */}
        <div className="flex items-start gap-3 flex-shrink-0">
          <div className="text-right flex flex-col items-end gap-1 min-w-[88px] leading-tight">
            <span className={`text-xs font-medium ${getStatusColor(goal)} whitespace-nowrap`}>
              {getStatusLabel(goal)}
            </span>
            <span className="text-xs text-on-surface-variant/60 whitespace-nowrap capitalize">
              {goal.goalType}
            </span>
          </div>
          <div className="relative">
            <button
              onClick={() => setOpenMenuId(menuOpen ? null : goal.id)}
              className="text-on-surface-variant/60 hover:text-on-surface transition-colors p-1"
              title="More actions"
            >
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-surface-container-high border border-outline-variant/20 rounded-sm shadow-lg py-1 min-w-[140px]">
                  <button
                    onClick={() => { updateGoal(goal.id, { isActive: goal.isActive === false }); setOpenMenuId(null); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">{goal.isActive === false ? 'unarchive' : 'archive'}</span>
                    {goal.isActive === false ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    onClick={async () => { setOpenMenuId(null); if (await confirm({ message: 'Delete this goal?' })) deleteGoal(goal.id); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-error hover:bg-error/10 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
