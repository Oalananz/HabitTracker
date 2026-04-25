'use client';

import { useMemo, useState } from 'react';
import Leaderboard from './Leaderboard';
import FailureFeed from './FailureFeed';
import type { JourneyDetailsResponse } from './types';

interface JourneyDetailsProps {
  details: JourneyDetailsResponse | null;
  isLoading: boolean;
  onJoin: () => Promise<void>;
  onLeave: () => Promise<void>;
  onFail: () => Promise<void>;
  onCheckIn: (note?: string) => Promise<void>;
  onInvite: (input: { username?: string; email?: string }) => Promise<void>;
  onAddConsequence: (input: {
    failureThreshold: number;
    description: string;
    consequenceType?: 'text' | 'symbolic' | 'warning' | 'penalty';
    symbol?: string;
  }) => Promise<void>;
  onEncourage: (input: { toUserId?: string; emoji?: string; message?: string }) => Promise<void>;
  onEdit?: () => void;
  onDelete?: () => Promise<void>;
}

export default function JourneyDetails({
  details,
  isLoading,
  onJoin,
  onLeave,
  onFail,
  onCheckIn,
  onInvite,
  onAddConsequence,
  onEncourage,
  onEdit,
  onDelete,
}: JourneyDetailsProps) {
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const [newThreshold, setNewThreshold] = useState('');
  const [newConsequenceDescription, setNewConsequenceDescription] = useState('');
  const [newConsequenceType, setNewConsequenceType] = useState<'text' | 'symbolic' | 'warning' | 'penalty'>('text');
  const [newConsequenceSymbol, setNewConsequenceSymbol] = useState('');

  const [encourageTarget, setEncourageTarget] = useState('');
  const [encourageEmoji, setEncourageEmoji] = useState('👏');
  const [encourageMessage, setEncourageMessage] = useState('Stay locked in.');

  const [consequencesOpen, setConsequencesOpen] = useState(false);
  const [encouragementOpen, setEncouragementOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeParticipants = useMemo(
    () => details?.participants.filter((participant) => participant.status !== 'left') || [],
    [details]
  );

  if (isLoading && !details) {
    return (
      <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
        <div className="font-mono text-xs text-on-surface-variant">
          <span className="animate-blink text-primary">▊</span> Loading competitive journey...
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
        <div className="font-mono text-xs text-on-surface-variant">
          Select a journey to view leaderboard, failures, rules, and consequences.
        </div>
      </div>
    );
  }

  const isOwner = details.myMembership?.role === 'owner';
  const canFail = details.myMembership?.status === 'active';

  const handleInvite = async () => {
    await onInvite({
      username: inviteUsername.trim() || undefined,
      email: inviteEmail.trim() || undefined,
    });
    setInviteUsername('');
    setInviteEmail('');
  };

  const handleConsequence = async () => {
    const threshold = Number(newThreshold);
    if (!Number.isInteger(threshold) || threshold <= 0) return;
    if (!newConsequenceDescription.trim()) return;

    await onAddConsequence({
      failureThreshold: threshold,
      description: newConsequenceDescription.trim(),
      consequenceType: newConsequenceType,
      symbol: newConsequenceSymbol.trim() || undefined,
    });

    setNewThreshold('');
    setNewConsequenceDescription('');
    setNewConsequenceType('text');
    setNewConsequenceSymbol('');
  };

  const handleEncourage = async () => {
    await onEncourage({
      toUserId: encourageTarget || undefined,
      emoji: encourageEmoji || '👏',
      message: encourageMessage.trim() || undefined,
    });
    setEncourageMessage('Stay locked in.');
  };

  const fallbackCopyText = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  };

  const copyInviteLink = async (path: string) => {
    const url = `${window.location.origin}${path}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const copied = fallbackCopyText(url);
        if (!copied) throw new Error('Fallback copy failed');
      }
      setCopyFeedback('Invite link copied.');
    } catch {
      setCopyFeedback('Could not copy automatically. Manually copy the invite link shown below.');
    }
  };

  return (
    <div className="space-y-3 pb-4">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/5 rounded-lg border border-outline-variant/20 p-4 space-y-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-headline text-lg font-bold text-on-surface">{details.journey.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded-sm font-mono text-[10px] font-semibold ${
                    details.journey.visibility === 'public'
                      ? 'bg-secondary/20 text-secondary'
                      : 'bg-tertiary/20 text-tertiary'
                  }`}
                >
                  {details.journey.visibility.toUpperCase()}
                </span>
              </div>
              {details.journey.description && (
                <p className="font-body text-xs text-on-surface-variant line-clamp-2">{details.journey.description}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {details.canJoin && (
                <button
                  onClick={onJoin}
                  className="px-2.5 py-1.5 rounded-sm bg-secondary/20 text-secondary font-label text-[10px] uppercase tracking-wider font-bold"
                >
                  Join
                </button>
              )}
              {isOwner && (
                <>
                  <button
                    onClick={onEdit}
                    className="px-2.5 py-1.5 rounded-sm bg-secondary/20 text-secondary font-label text-[10px] uppercase tracking-wider"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="px-2.5 py-1.5 rounded-sm bg-error/20 text-error font-label text-[10px] uppercase tracking-wider font-bold"
                  >
                    Delete
                  </button>
                </>
              )}
              {details.myMembership && details.myMembership.role !== 'owner' && (
                <button
                  onClick={onLeave}
                  className="px-2.5 py-1.5 rounded-sm bg-surface-container-high text-on-surface-variant font-label text-[10px] uppercase tracking-wider"
                >
                  Leave
                </button>
              )}
              {canFail && (
                <button
                  onClick={onFail}
                  className="px-2.5 py-1.5 rounded-sm bg-error-container text-on-error-container font-label text-[10px] uppercase tracking-wider font-bold"
                >
                  I Failed
                </button>
              )}
              {canFail && details.ruleSummary.structured.mandatoryDailyCheckIn && (
                <button
                  onClick={() => onCheckIn('daily check-in')}
                  className="px-2.5 py-1.5 rounded-sm bg-primary/20 text-primary font-label text-[10px] uppercase tracking-wider font-bold"
                >
                  Check-in
                </button>
              )}
            </div>
          </div>

          {/* Stats Grid - 4 columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-surface-container-lowest/60 border border-outline-variant/10 rounded-sm p-2.5">
              <div className="font-mono text-[9px] text-on-surface-variant/70 uppercase">Participants</div>
              <div className="font-headline text-base font-bold text-primary mt-1">{activeParticipants.length}</div>
            </div>
            <div className="bg-surface-container-lowest/60 border border-outline-variant/10 rounded-sm p-2.5">
              <div className="font-mono text-[9px] text-on-surface-variant/70 uppercase">Total Fails</div>
              <div className="font-headline text-base font-bold text-error mt-1">{details.recentFailures.length}</div>
            </div>
            <div className="bg-surface-container-lowest/60 border border-outline-variant/10 rounded-sm p-2.5">
              <div className="font-mono text-[9px] text-on-surface-variant/70 uppercase">Rules</div>
              <div className="font-headline text-base font-bold text-tertiary mt-1">{details.consequences.length}</div>
            </div>
            <div className="bg-surface-container-lowest/60 border border-outline-variant/10 rounded-sm p-2.5">
              <div className="font-mono text-[9px] text-on-surface-variant/70 uppercase">Max Fails</div>
              <div className="font-headline text-base font-bold text-secondary mt-1">
                {details.ruleSummary.maxFailures ?? '∞'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rule Summary & Participants Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-surface-container-low rounded-lg border border-outline-variant/15 p-3.5 space-y-3">
          <div className="font-label text-xs uppercase tracking-wider text-on-surface-variant font-semibold">📋 Rules</div>
          {details.ruleSummary.text ? (
            <p className="font-body text-sm text-on-surface leading-relaxed line-clamp-3 break-words" dir="auto">{details.ruleSummary.text}</p>
          ) : (
            <p className="font-mono text-xs text-outline">No rule summary provided.</p>
          )}
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px] text-on-surface-variant/80 border-t border-outline-variant/10 pt-2">
            <div><span className="text-outline">Weekly limit:</span> {details.ruleSummary.structured.noMoreThanFailuresPerWeek ?? 'off'}</div>
            <div><span className="text-outline">Streak reset:</span> {details.ruleSummary.structured.resetStreakOnFailure === false ? 'off' : 'on'}</div>
            <div><span className="text-outline">Check-in:</span> {details.ruleSummary.structured.mandatoryDailyCheckIn ? 'on' : 'off'}</div>
            <div><span className="text-outline">Sync:</span> {details.ruleSummary.structured.syncToPersonal ? 'on' : 'off'}</div>
          </div>
          
          {details.ruleSummary.consequenceRules && (
            <div className="border-t border-outline-variant/10 pt-2.5 space-y-1.5">
              <div className="font-label text-[10px] uppercase tracking-wider text-tertiary font-semibold">⚖️ Consequence Rules</div>
              <div className="font-body text-sm text-on-surface bg-tertiary/5 border border-tertiary/20 rounded-sm p-2.5 break-words" dir="auto">
                {details.ruleSummary.consequenceRules}
              </div>
            </div>
          )}
        </div>

        <div className="bg-surface-container-low rounded-lg border border-outline-variant/15 p-3.5 space-y-2">
          <div className="font-label text-xs uppercase tracking-wider text-on-surface-variant font-semibold">👥 Participants</div>
          <div className="max-h-[160px] overflow-y-auto divide-y divide-outline-variant/10 space-y-1.5">
            {activeParticipants.map((participant) => {
              const participantConsequenceStates = details.consequenceStatusByParticipant[participant.id] || [];
              return (
                <div key={participant.id} className="pt-1.5 first:pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-body text-sm text-on-surface font-medium">
                        {participant.username}
                        {participant.role === 'owner' ? ' 👑' : ''}
                      </div>
                      <div className="font-mono text-[9px] text-on-surface-variant/80">
                        {participant.totalFailures} fails{' '}
                        {participantConsequenceStates.length > 0 && (
                          <span className="text-error">• {participantConsequenceStates.length} consequence(s)</span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded-sm ${
                        participant.status === 'failed'
                          ? 'bg-error/20 text-error'
                          : 'bg-primary/20 text-primary'
                      }`}
                    >
                      {participant.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leaderboard & Failure Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Leaderboard rows={details.leaderboard} />
        <FailureFeed failures={details.recentFailures} />
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-2">
        {/* Consequences Section */}
        <button
          onClick={() => setConsequencesOpen(!consequencesOpen)}
          className="w-full text-left bg-surface-container-low hover:bg-surface-container rounded-lg border border-outline-variant/15 p-3 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="font-headline text-sm font-semibold uppercase tracking-wide text-on-surface">
              <span className="text-tertiary text-lg">⚖️</span> Consequences {details.consequences.length > 0 && <span className="text-xs text-on-surface-variant ml-1">({details.consequences.length})</span>}
            </div>
            <span className={`text-on-surface-variant transition-transform ${consequencesOpen ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </button>

        {consequencesOpen && (
          <div className="bg-surface-container-low rounded-lg border border-outline-variant/15 p-3.5 space-y-3">
            {details.consequences.length === 0 ? (
              <div className="font-mono text-xs text-outline py-2">No consequence thresholds configured yet.</div>
            ) : (
              <div className="space-y-1.5">
                {details.consequences.map((consequence) => (
                  <div key={consequence.id} className="p-2 rounded-sm bg-surface-container-lowest border border-outline-variant/10">
                    <div className="font-body text-sm text-on-surface">
                      {consequence.symbol ? <span className="mr-1.5">{consequence.symbol}</span> : ''}
                      {consequence.description}
                    </div>
                    <div className="font-mono text-[9px] text-on-surface-variant/80 mt-0.5">
                      @ {consequence.failureThreshold} fail{consequence.failureThreshold !== 1 ? 's' : ''} • {consequence.consequenceType}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isOwner && (
              <div className="border-t border-outline-variant/15 pt-3 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="number"
                    min={1}
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(e.target.value)}
                    className="sm:col-span-1 bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-2 py-1.5 text-sm text-on-surface"
                    placeholder="Threshold"
                  />
                  <input
                    value={newConsequenceDescription}
                    onChange={(e) => setNewConsequenceDescription(e.target.value)}
                    className="sm:col-span-2 bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-2 py-1.5 text-sm text-on-surface"
                    placeholder="Consequence description"
                  />
                  <button
                    onClick={handleConsequence}
                    className="px-3 py-1.5 rounded-sm bg-primary/20 text-primary font-label text-[10px] uppercase"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Encouragement Section */}
        <button
          onClick={() => setEncouragementOpen(!encouragementOpen)}
          className="w-full text-left bg-surface-container-low hover:bg-surface-container rounded-lg border border-outline-variant/15 p-3 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="font-headline text-sm font-semibold uppercase tracking-wide text-on-surface">
              <span className="text-secondary text-lg">💪</span> Encouragement {details.reactions.length > 0 && <span className="text-xs text-on-surface-variant ml-1">({details.reactions.length})</span>}
            </div>
            <span className={`text-on-surface-variant transition-transform ${encouragementOpen ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </button>

        {encouragementOpen && (
          <div className="bg-surface-container-low rounded-lg border border-outline-variant/15 p-3.5 space-y-3">
            <div className="max-h-[200px] overflow-y-auto divide-y divide-outline-variant/10">
              {details.reactions.length === 0 ? (
                <div className="py-2 font-mono text-xs text-outline">No encouragement messages yet.</div>
              ) : (
                details.reactions.map((reaction) => (
                  <div key={reaction.id} className="py-1.5">
                    <div className="font-body text-sm text-on-surface">
                      <span className="text-lg">{reaction.emoji}</span> <span className="font-semibold">{reaction.fromUsername}</span>
                      {reaction.toUsername && <span className="text-on-surface-variant"> → {reaction.toUsername}</span>}
                    </div>
                    {reaction.message && (
                      <div className="font-mono text-[10px] text-on-surface-variant/80 mt-0.5">{reaction.message}</div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-outline-variant/15 pt-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <select
                  value={encourageTarget}
                  onChange={(e) => setEncourageTarget(e.target.value)}
                  className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-2 py-1.5 text-sm text-on-surface"
                >
                  <option value="">All participants</option>
                  {activeParticipants.map((participant) => (
                    <option key={participant.id} value={participant.userId}>
                      {participant.username}
                    </option>
                  ))}
                </select>
                <input
                  value={encourageEmoji}
                  onChange={(e) => setEncourageEmoji(e.target.value)}
                  className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-2 py-1.5 text-sm text-on-surface text-center"
                  placeholder="emoji"
                  maxLength={2}
                />
                <input
                  value={encourageMessage}
                  onChange={(e) => setEncourageMessage(e.target.value)}
                  className="sm:col-span-2 bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-2 py-1.5 text-sm text-on-surface"
                  placeholder="Your message"
                />
                <button
                  onClick={handleEncourage}
                  className="px-3 py-1.5 rounded-sm bg-secondary/20 text-secondary font-label text-[10px] uppercase font-bold"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Section */}
        {isOwner && (
          <>
            <button
              onClick={() => setInviteOpen(!inviteOpen)}
              className="w-full text-left bg-surface-container-low hover:bg-surface-container rounded-lg border border-outline-variant/15 p-3 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="font-headline text-sm font-semibold uppercase tracking-wide text-on-surface">
                  <span className="text-primary text-lg">📨</span> Invite {details.invites.length > 0 && <span className="text-xs text-on-surface-variant ml-1">({details.invites.length})</span>}
                </div>
                <span className={`text-on-surface-variant transition-transform ${inviteOpen ? 'rotate-180' : ''}`}>▼</span>
              </div>
            </button>

            {inviteOpen && (
              <div className="bg-surface-container-low rounded-lg border border-outline-variant/15 p-3.5 space-y-3">
                {copyFeedback && (
                  <div className="font-mono text-[11px] text-secondary bg-secondary/10 border border-secondary/20 rounded-sm px-2.5 py-1.5">
                    ✓ {copyFeedback}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      value={inviteUsername}
                      onChange={(e) => setInviteUsername(e.target.value)}
                      className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-2 py-1.5 text-sm text-on-surface"
                      placeholder="username (optional)"
                    />
                    <input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-2 py-1.5 text-sm text-on-surface"
                      placeholder="email (optional)"
                    />
                    <button
                      onClick={handleInvite}
                      className="px-3 py-1.5 rounded-sm bg-primary/20 text-primary font-label text-[10px] uppercase font-bold"
                    >
                      Create Invite
                    </button>
                  </div>

                  {details.invites.length > 0 && (
                    <div className="max-h-[180px] overflow-y-auto divide-y divide-outline-variant/10 bg-surface-container-lowest/50 rounded-sm border border-outline-variant/10 p-2">
                      {details.invites.map((invite) => (
                        <div key={invite.id} className="py-1.5 first:pt-0 last:pb-0">
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <div className="min-w-0 flex-1">
                              <div className="font-body text-on-surface font-medium truncate">
                                {invite.inviteeUsername || invite.inviteeEmail || 'link invite'}
                              </div>
                              <div className="font-mono text-[9px] text-on-surface-variant/80 truncate">
                                {invite.inviteLinkPath}
                              </div>
                              <div className="font-mono text-[9px] text-on-surface-variant/60 mt-0.5">
                                {invite.status}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                void copyInviteLink(invite.inviteLinkPath);
                              }}
                              className="px-2 py-1 rounded-sm bg-secondary/20 text-secondary font-label text-[9px] uppercase font-bold whitespace-nowrap shrink-0"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-low rounded-lg border border-outline-variant/20 p-5 shadow-lg max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">⚠️</span>
              <h3 className="font-headline text-lg font-bold text-on-surface">Delete Journey?</h3>
            </div>
            <p className="font-body text-sm text-on-surface-variant mb-5 leading-relaxed">
              This will permanently delete <strong>&quot;{details?.journey.name}&quot;</strong> and all associated data (failures, consequences, participants). This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="px-3 py-2 rounded-sm bg-surface-container border border-outline-variant/20 text-on-surface font-label text-xs uppercase tracking-wider disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await onDelete?.();
                    setDeleteConfirmOpen(false);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="px-3 py-2 rounded-sm bg-error text-on-error font-label text-xs uppercase tracking-wider font-bold disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Journey'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
