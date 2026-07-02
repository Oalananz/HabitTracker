'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import TimerDisplay from '@/components/recovery/TimerDisplay';
import CompetitiveMode from '@/components/recovery/competitive/CompetitiveMode';
import FailureLogList from '@/components/recovery/FailureLogList';
import { useConfirm } from '@/components/ui/useConfirm';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import dayjs from 'dayjs';

export default function RecoveryPage() {
  const {
    journeys, isRecoveryLoading, failures,
    fetchJourneys, fetchFailures, createJourney, deleteJourney,
    recordJourneyFailure, resetJourney,
    dayRecord, fetchDayRecord,
  } = useStore();

  const today = dayjs().format('YYYY-MM-DD');

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStartTime, setNewStartTime] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));
  const [confirmFail, setConfirmFail] = useState<string | null>(null);
  const [expandedJourney, setExpandedJourney] = useState<string | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    fetchJourneys();
    fetchFailures();
    void fetchDayRecord(dayjs().format('YYYY-MM-DD'));
  }, [fetchJourneys, fetchFailures, fetchDayRecord]);

  useEffect(() => {
    const id = setInterval(() => setClockNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      await createJourney({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        startTime: new Date(newStartTime).toISOString(),
      });
      setNewTitle('');
      setNewDesc('');
      setNewStartTime(dayjs().format('YYYY-MM-DDTHH:mm'));
      setShowCreate(false);
    } catch {
      // silent fail
    }
  };

  const handleFail = async (journeyId: string) => {
    setConfirmFail(null);
    try {
      await recordJourneyFailure(journeyId);
    } catch {
      // silent fail
    }
  };

  const getMilestones = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = clockNow;
    const days = (now - start) / (1000 * 60 * 60 * 24);

    return [
      { d: 7, label: '7D', unlocked: days >= 7 },
      { d: 30, label: '30D', unlocked: days >= 30 },
      { d: 90, label: '90D', unlocked: days >= 90 },
      { d: 365, label: '1Y', unlocked: days >= 365 },
    ];
  };

  return (
    <div className="space-y-8 animate-page-enter">
        {ConfirmDialog}
        <PageHeader
          title="Recovery"
          description="Track multiple recovery paths. Each journey runs independently."
          actions={
            <Button variant="primary" icon="add" onClick={() => setShowCreate(!showCreate)} id="create-journey-btn">
              New journey
            </Button>
          }
        />

        {/* Create Journey Form */}
        {showCreate && (
          <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 animate-fade-in space-y-4">
            <h3 className="font-headline text-sm font-semibold text-on-surface">New journey</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-on-surface-variant/80 block mb-1.5">Journey title</label>
                <Input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. No Smoking, Sobriety, No Sugar"
                  id="journey-title"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant/80 block mb-1.5">Start time</label>
                <Input
                  type="datetime-local"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  id="journey-start-time"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-on-surface-variant/80 block mb-1.5">Description (optional)</label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                placeholder="Why this journey matters to you..."
                id="journey-desc"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="primary" onClick={handleCreate} disabled={!newTitle.trim()}>
                Start journey
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isRecoveryLoading ? (
          <div className="flex items-center gap-2 py-16 justify-center font-mono text-sm text-on-surface-variant">
            <span className="animate-blink text-primary">▊</span> Loading journeys...
          </div>
        ) : journeys.length === 0 ? (
          <EmptyState
            icon="healing"
            title="No recovery journeys yet"
            description={'Click "New journey" to start tracking a recovery path.'}
          />
        ) : (
          <div className="space-y-6">
            {journeys.map((journey) => {
              const milestones = getMilestones(journey.startTime);
              const isExpanded = expandedJourney === journey.id;

              return (
                <div
                  key={journey.id}
                  className="bg-surface-container-low rounded-md border border-outline-variant/15 overflow-hidden"
                >
                  {/* Journey Header */}
                  <div
                    className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-surface-container-lowest/30 transition-colors"
                    onClick={() => setExpandedJourney(isExpanded ? null : journey.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                        healing
                      </span>
                      <div>
                        <h3 className="font-headline text-lg font-bold text-on-surface">{journey.title}</h3>
                        {journey.description && (
                          <p className="font-body text-xs text-on-surface-variant mt-0.5">{journey.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Today status tag */}
                      {(() => {
                        const todayFailure = failures.some(f =>
                          dayjs(f.timestamp).format('YYYY-MM-DD') === today &&
                          f.journeyId === journey.id
                        );
                        const noMasClean = dayRecord?.noMasturbation ?? false;
                        if (todayFailure) {
                          return (
                            <span className="hidden sm:flex items-center gap-1 text-xs text-error px-2 py-0.5 bg-error/10 rounded-[2px]">
                              <span className="material-symbols-outlined text-[12px]">cancel</span>
                              Failure logged
                            </span>
                          );
                        }
                        if (noMasClean || !todayFailure) {
                          return (
                            <span className="hidden sm:flex items-center gap-1 text-xs text-primary px-2 py-0.5 bg-primary/10 rounded-[2px]">
                              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                              Clean today
                            </span>
                          );
                        }
                        return (
                          <span className="hidden sm:flex items-center gap-1 text-xs text-on-surface-variant/60 px-2 py-0.5 rounded-[2px]">
                            Not logged
                          </span>
                        );
                      })()}
                      <span className="text-xs text-on-surface-variant">
                        {journey.failureCount} fail{journey.failureCount !== 1 ? 's' : ''}
                      </span>
                      <span className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-outline-variant/10 animate-fade-in">
                      {/* Timer */}
                      <TimerDisplay startTime={journey.startTime} now={clockNow} />

                      {/* Milestones */}
                      <div className="px-5 pb-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                          {milestones.map((m) => (
                            <div
                              key={m.d}
                              className={`p-3 rounded-sm border text-center ${
                                m.unlocked
                                  ? 'border-primary/30 bg-primary/5'
                                  : 'border-outline-variant/15 bg-surface-container-lowest'
                              }`}
                            >
                              <div className="font-headline text-lg font-bold text-on-surface">{m.label}</div>
                              <div className={`text-xs ${m.unlocked ? 'text-primary' : 'text-on-surface-variant/50'}`}>
                                {m.unlocked ? '✓ Unlocked' : 'Locked'}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Recent Failure Logs */}
                        <div className="mb-4">
                          <FailureLogList
                            failures={failures.filter(f => f.journeyId === journey.id)}
                            startTime={journey.startTime}
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3 items-center">
                          {confirmFail !== journey.id ? (
                            <Button variant="danger" icon="warning" onClick={() => setConfirmFail(journey.id)}>
                              I failed
                            </Button>
                          ) : (
                            <div className="flex gap-2 animate-fade-in">
                              <Button variant="ghost" onClick={() => setConfirmFail(null)}>Abort</Button>
                              <Button variant="danger" onClick={() => handleFail(journey.id)}>Confirm failure</Button>
                            </div>
                          )}
                          <Button variant="secondary" onClick={() => resetJourney(journey.id, false)}>
                            Reset timer
                          </Button>
                          <Button variant="secondary" onClick={() => resetJourney(journey.id, true)}>
                            Reset + clear
                          </Button>
                          <button
                            onClick={async () => { if (await confirm({ message: 'Delete this journey?' })) deleteJourney(journey.id); }}
                            className="p-2 text-on-surface-variant/60 hover:text-error transition-colors ml-auto"
                            title="Delete journey"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 border-t border-outline-variant/10">
          <CompetitiveMode />
        </div>
      </div>
  );
}
