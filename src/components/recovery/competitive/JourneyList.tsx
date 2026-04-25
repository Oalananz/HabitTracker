'use client';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { JourneyCatalogResponse } from './types';

dayjs.extend(relativeTime);

interface JourneyListProps {
  catalog: JourneyCatalogResponse;
  selectedJourneyId: string | null;
  onSelectJourney: (journeyId: string) => void;
  onJoinPublicJourney: (journeyId: string) => Promise<void>;
  onRespondInvite: (
    journeyId: string,
    token: string,
    decision: 'accept' | 'decline'
  ) => Promise<void>;
}

function visibilityChip(visibility: 'private' | 'public') {
  if (visibility === 'public') {
    return <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary font-mono text-xs border border-secondary/20">PUBLIC</span>;
  }

  return <span className="px-2 py-0.5 rounded bg-tertiary/15 text-tertiary font-mono text-xs border border-tertiary/20">PRIVATE</span>;
}

export default function JourneyList({
  catalog,
  selectedJourneyId,
  onSelectJourney,
  onJoinPublicJourney,
  onRespondInvite,
}: JourneyListProps) {
  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant/15 p-6 shadow-sm flex flex-col h-full space-y-6">
      <div className="border-b border-outline-variant/10 pb-4 mb-2">
        <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
          <span className="text-secondary tracking-widest text-xl">⚡</span> ACTIVE ARENAS
        </h3>
        <p className="font-body text-sm text-on-surface-variant mt-1.5 leading-relaxed">
          Manage your memberships, review invites, and discover new public trials.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
           <div className="h-px bg-outline-variant/20 flex-1"></div>
           <div className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant/70">
             Your Journeys
           </div>
           <div className="h-px bg-outline-variant/20 flex-1"></div>
        </div>

        {catalog.journeys.length === 0 ? (
          <div className="p-5 text-center flex flex-col items-center justify-center rounded-lg bg-surface-container-lowest/50 border border-dashed border-outline-variant/20">
            <span className="text-2xl mb-2 opacity-50">🛡️</span>
            <span className="font-mono text-sm text-outline">You haven&apos;t joined any arenas yet.</span>
          </div>
        ) : (
          catalog.journeys.map((journey) => {
            const isActive = selectedJourneyId === journey.id;
            return (
              <button
                key={journey.id}
                onClick={() => onSelectJourney(journey.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-200 group ${
                  isActive
                    ? 'border-primary/60 bg-primary/10 shadow-sm outline-[1px] outline-primary/30 outline-offset-1'
                    : 'border-outline-variant/20 bg-surface-container-lowest hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="font-headline text-base font-bold text-on-surface truncate group-hover:text-primary transition-colors">{journey.name}</div>
                  <div className="flex items-center gap-2 shrink-0">
                    {visibilityChip(journey.visibility)}
                    {journey.myStatus === 'failed' && (
                      <span className="px-2 py-0.5 rounded bg-error-container/80 text-on-error-container font-mono text-xs border border-error/20 font-bold shadow-sm">
                        FAILED
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 font-mono text-xs text-on-surface-variant/80 border-t border-outline-variant/10 pt-3 mt-1">
                  <div className="flex flex-col"><span className="text-[10px] uppercase text-outline mb-0.5">Warriors</span> <span className="font-medium text-on-surface-variant">{journey.participantCount}</span></div>
                  <div className="flex flex-col"><span className="text-[10px] uppercase text-outline mb-0.5">Tot. Fails</span> <span className="font-medium text-on-surface-variant">{journey.totalFailures}</span></div>
                  <div className="flex flex-col"><span className="text-[10px] uppercase text-outline mb-0.5">Your Fails</span> <span className={`font-medium ${journey.myFailures > 0 ? 'text-error' : 'text-primary'}`}>{journey.myFailures}</span></div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2 mt-4">
           <div className="h-px bg-outline-variant/20 flex-1"></div>
           <div className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant/70">
             Pending Invites
           </div>
           <div className="h-px bg-outline-variant/20 flex-1"></div>
        </div>

        {catalog.pendingInvites.length === 0 ? (
          <div className="p-4 text-center rounded-lg bg-surface-container-lowest/50 border border-dashed border-outline-variant/20 font-mono text-sm text-outline">
            No incoming challenges.
          </div>
        ) : (
          catalog.pendingInvites.map((invite) => (
            <div
              key={invite.id}
              className="p-4 rounded-lg border border-secondary/30 bg-secondary/5 relative overflow-hidden shadow-sm"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-headline text-base font-bold text-on-surface">
                    {invite.journey?.name || 'Unknown Journey'}
                  </div>
                  <div className="font-mono text-xs text-on-surface-variant mt-1.5 flex items-center gap-1.5">
                    <span className="opacity-70">invited</span>
                    <span className="text-secondary/80 font-medium">{dayjs(invite.createdAt).fromNow()}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => onRespondInvite(invite.journeyId, invite.token, 'decline')}
                    className="px-4 py-2 rounded-md bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 text-on-surface-variant font-label text-xs uppercase tracking-wider font-semibold transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => onRespondInvite(invite.journeyId, invite.token, 'accept')}
                    className="px-4 py-2 rounded-md bg-secondary text-on-secondary hover:bg-secondary/90 font-label text-xs uppercase tracking-wider font-bold transition-all hover:scale-[1.02] shadow-sm"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2 mt-4">
           <div className="h-px bg-outline-variant/20 flex-1"></div>
           <div className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant/70">
             Public Arenas
           </div>
           <div className="h-px bg-outline-variant/20 flex-1"></div>
        </div>

        {catalog.publicJourneys.length === 0 ? (
          <div className="p-4 text-center rounded-lg bg-surface-container-lowest/50 border border-dashed border-outline-variant/20 font-mono text-sm text-outline">
            No public arenas currently open.
          </div>
        ) : (
          <div className="grid gap-3">
            {catalog.publicJourneys.map((journey) => (
              <div
                key={journey.id}
                className="p-4 rounded-lg border border-outline-variant/15 bg-surface-container-lowest hover:border-outline-variant/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 pr-2">
                    <div className="font-headline text-base font-bold text-on-surface truncate">{journey.name}</div>
                    <div className="font-mono text-xs text-on-surface-variant mt-1.5 flex items-center gap-3">
                      <span className="inline-flex items-center gap-1"><span className="opacity-60 text-[10px]">👥</span> {journey.participantCount}</span>
                      <span className="inline-flex items-center gap-1 text-error/80"><span className="opacity-60 text-[10px] text-on-surface-variant">❌</span> {journey.totalFailures} fails</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onJoinPublicJourney(journey.id)}
                    className="px-4 py-2 rounded-md bg-surface-container-high border border-outline-variant/30 hover:border-secondary/50 hover:text-secondary text-on-surface font-label text-xs uppercase tracking-wider font-bold shrink-0 transition-all"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
