'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import AppShell from '@/components/layout/AppShell';
import TimerDisplay from '@/components/recovery/TimerDisplay';
import dayjs from 'dayjs';

export default function RecoveryPage() {
  const {
    journeys, isRecoveryLoading,
    fetchJourneys, createJourney, deleteJourney,
    recordJourneyFailure, resetJourney,
  } = useStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStartTime, setNewStartTime] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));
  const [confirmFail, setConfirmFail] = useState<string | null>(null);
  const [expandedJourney, setExpandedJourney] = useState<string | null>(null);

  useEffect(() => {
    fetchJourneys();
  }, [fetchJourneys]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createJourney({
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      startTime: new Date(newStartTime).toISOString(),
    });
    setNewTitle('');
    setNewDesc('');
    setNewStartTime(dayjs().format('YYYY-MM-DDTHH:mm'));
    setShowCreate(false);
  };

  const handleFail = async (journeyId: string) => {
    setConfirmFail(null);
    await recordJourneyFailure(journeyId);
  };

  const getMilestones = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const days = (now - start) / (1000 * 60 * 60 * 24);

    return [
      { d: 7, label: '7D', unlocked: days >= 7 },
      { d: 30, label: '30D', unlocked: days >= 30 },
      { d: 90, label: '90D', unlocked: days >= 90 },
      { d: 365, label: '1Y', unlocked: days >= 365 },
    ];
  };

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter text-on-surface mb-2">
              <span className="text-primary">&gt;</span> Recovery Journeys
            </h1>
            <p className="font-body text-on-surface-variant">
              Track multiple recovery paths. Each journey runs independently.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-5 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity flex-shrink-0"
            id="create-journey-btn"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Journey
          </button>
        </header>

        {/* Create Journey Form */}
        {showCreate && (
          <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 animate-fade-in space-y-4">
            <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
              <span className="text-primary">&gt;</span> INIT_NEW_JOURNEY
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
                  &gt; JOURNEY_TITLE
                </label>
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
                  <span className="text-primary font-mono text-sm">&gt;</span>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
                    placeholder="e.g. No Smoking, Sobriety, No Sugar"
                    id="journey-title"
                  />
                </div>
              </div>
              <div>
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
                  &gt; START_TIME
                </label>
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
                  <span className="text-primary font-mono text-sm">&gt;</span>
                  <input
                    type="datetime-local"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-transparent text-on-surface text-sm font-body border-none p-0 focus:ring-0"
                    id="journey-start-time"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
                &gt; DESCRIPTION (optional)
              </label>
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 focus-within:border-primary/50 transition-colors">
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0 resize-none"
                  rows={2}
                  placeholder="Why this journey matters to you..."
                  id="journey-desc"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="px-5 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                INITIALIZE JOURNEY ↵
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-surface-container-high text-on-surface-variant font-label text-xs uppercase rounded-sm hover:bg-surface-bright transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isRecoveryLoading ? (
          <div className="flex items-center gap-2 py-16 justify-center font-mono text-sm text-on-surface-variant">
            <span className="animate-blink text-primary">▊</span> Loading journeys...
          </div>
        ) : journeys.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-[48px] text-outline-variant mb-4 block">healing</span>
            <p className="font-body text-on-surface-variant mb-2">No recovery journeys yet.</p>
            <p className="font-mono text-xs text-outline">Click &quot;New Journey&quot; to start tracking a recovery path.</p>
          </div>
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
                      {/* Mini milestones */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        {milestones.map((m) => (
                          <span
                            key={m.d}
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm ${
                              m.unlocked
                                ? 'bg-primary/20 text-primary'
                                : 'bg-surface-container-high text-outline'
                            }`}
                          >
                            {m.label}
                          </span>
                        ))}
                      </div>
                      <span className="font-mono text-xs text-on-surface-variant">
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
                      <TimerDisplay startTime={journey.startTime} />

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
                              <div className={`font-label text-[10px] uppercase tracking-widest ${m.unlocked ? 'text-primary' : 'text-outline'}`}>
                                {m.unlocked ? '✓ UNLOCKED' : 'LOCKED'}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                          {confirmFail !== journey.id ? (
                            <button
                              onClick={() => setConfirmFail(journey.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-error-container text-on-error-container font-headline font-bold text-xs uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity"
                            >
                              <span className="material-symbols-outlined text-[16px]">warning</span>
                              I FAILED
                            </button>
                          ) : (
                            <div className="flex gap-2 animate-fade-in">
                              <button
                                onClick={() => setConfirmFail(null)}
                                className="px-4 py-2 bg-surface-container-high text-on-surface-variant font-label text-xs uppercase rounded-sm"
                              >
                                ABORT
                              </button>
                              <button
                                onClick={() => handleFail(journey.id)}
                                className="px-4 py-2 bg-error text-on-error font-label text-xs uppercase font-bold rounded-sm"
                              >
                                CONFIRM FAILURE
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => resetJourney(journey.id, false)}
                            className="px-4 py-2 bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant font-label text-xs uppercase rounded-sm hover:bg-surface-container-high transition-colors"
                          >
                            Reset Timer
                          </button>
                          <button
                            onClick={() => resetJourney(journey.id, true)}
                            className="px-4 py-2 bg-surface-container-lowest border border-error/20 text-error font-label text-xs uppercase rounded-sm hover:bg-error-container/20 transition-colors"
                          >
                            Reset + Clear
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete this journey?')) deleteJourney(journey.id); }}
                            className="px-4 py-2 bg-surface-container-lowest border border-error/20 text-error font-label text-xs uppercase rounded-sm hover:bg-error-container/20 transition-colors ml-auto"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
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
      </div>
    </AppShell>
  );
}
