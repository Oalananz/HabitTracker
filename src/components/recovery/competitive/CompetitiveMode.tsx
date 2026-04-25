'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import CreateJourney from './CreateJourney';
import EditJourney from './EditJourney';
import JourneyList from './JourneyList';
import JourneyDetails from './JourneyDetails';
import type { JourneyCatalogResponse, JourneyDetailsResponse } from './types';

const emptyCatalog: JourneyCatalogResponse = {
  journeys: [],
  publicJourneys: [],
  pendingInvites: [],
};

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

export default function CompetitiveMode() {
  const searchParams = useSearchParams();
  const [catalog, setCatalog] = useState<JourneyCatalogResponse>(emptyCatalog);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [details, setDetails] = useState<JourneyDetailsResponse | null>(null);

  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const inviteTokenHandled = useRef(false);
  const isPollingRef = useRef(false);

  const [isCreating, setIsCreating] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const request = useCallback(async <T,>(url: string, init?: RequestInit) => {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      ...init,
    });

    const data = await parseJson<T & { error?: string }>(res);

    if (!res.ok) {
      throw new Error(data.error || `Request failed: ${res.status}`);
    }

    return data;
  }, []);

  const loadCatalog = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsCatalogLoading(true);
      }

      try {
        const data = await request<JourneyCatalogResponse>('/api/journeys');
        setCatalog(data);

        if (!selectedJourneyId && data.journeys.length > 0) {
          setSelectedJourneyId(data.journeys[0].id);
        }
      } finally {
        if (!options?.silent) {
          setIsCatalogLoading(false);
        }
      }
    },
    [request, selectedJourneyId]
  );

  const loadDetails = useCallback(
    async (journeyId: string, options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsDetailsLoading(true);
      }

      try {
        const data = await request<JourneyDetailsResponse>(`/api/journeys/${journeyId}`);
        setDetails(data);
      } finally {
        if (!options?.silent) {
          setIsDetailsLoading(false);
        }
      }
    },
    [request]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCatalog().catch((error) => {
      setNotice({ type: 'error', message: error.message || 'Failed to load journeys' });
      setIsCatalogLoading(false);
    });
  }, [loadCatalog]);

  useEffect(() => {
    if (!selectedJourneyId) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDetails(selectedJourneyId).catch((error) => {
      setNotice({ type: 'error', message: error.message || 'Failed to load journey details' });
      setIsDetailsLoading(false);
    });
  }, [loadDetails, selectedJourneyId]);

  useEffect(() => {
    if (!selectedJourneyId) return;

    const interval = setInterval(() => {
      if (isPollingRef.current) return;
      if (typeof document !== 'undefined' && document.hidden) return;

      isPollingRef.current = true;
      Promise.all([
        loadCatalog({ silent: true }).catch(() => undefined),
        loadDetails(selectedJourneyId, { silent: true }).catch(() => undefined),
      ]).finally(() => {
        isPollingRef.current = false;
      });
    }, 20_000);

    return () => {
      clearInterval(interval);
      isPollingRef.current = false;
    };
  }, [loadCatalog, loadDetails, selectedJourneyId]);

  useEffect(() => {
    if (inviteTokenHandled.current) return;

    const inviteToken = searchParams.get('invite');
    const journeyId = searchParams.get('journey');
    if (!inviteToken || !journeyId) return;

    inviteTokenHandled.current = true;

    request(`/api/journeys/${journeyId}/join`, {
      method: 'POST',
      body: JSON.stringify({ token: inviteToken, decision: 'accept' }),
    })
      .then(async () => {
        setSelectedJourneyId(journeyId);
        await loadCatalog();
        await loadDetails(journeyId);
        setNotice({ type: 'success', message: 'Invite accepted. Joined journey successfully.' });
      })
      .catch((error) => {
        setNotice({ type: 'error', message: error.message || 'Failed to process invite link' });
      });
  }, [loadCatalog, loadDetails, request, searchParams]);

  const withErrorNotice = async (action: () => Promise<void>, successMessage?: string) => {
    try {
      await action();
      if (successMessage) {
        setNotice({ type: 'success', message: successMessage });
      }
    } catch (error) {
      setNotice({
        type: 'error',
        message: (error as Error).message || 'Action failed',
      });
    }
  };

  const handleCreateJourney = async (payload: {
    name: string;
    description?: string;
    startDate: string;
    endDate?: string;
    rulesText?: string;
    rules: {
      noMoreThanFailuresPerWeek?: number;
      resetStreakOnFailure?: boolean;
      mandatoryDailyCheckIn?: boolean;
      syncToPersonal?: boolean;
    };
    maxFailures?: number | null;
    consequenceRules?: string;
    visibility: 'private' | 'public';
    consequences: Array<{
      failureThreshold: number;
      description: string;
      consequenceType: 'text' | 'symbolic' | 'warning' | 'penalty';
      symbol?: string;
    }>;
  }) => {
    await withErrorNotice(async () => {
      const data = await request<{ journey: { id: string } }>('/api/journeys', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await loadCatalog();
      setSelectedJourneyId(data.journey.id);
      await loadDetails(data.journey.id);
    }, 'Competitive journey created.');
  };

  const joinJourney = async (journeyId: string, token?: string, decision: 'accept' | 'decline' = 'accept') => {
    await withErrorNotice(async () => {
      await request(`/api/journeys/${journeyId}/join`, {
        method: 'POST',
        body: JSON.stringify({ token, decision }),
      });

      await loadCatalog();
      if (decision === 'accept') {
        setSelectedJourneyId(journeyId);
        await loadDetails(journeyId);
      }
    }, decision === 'accept' ? 'Joined journey.' : 'Invite declined.');
  };

  const handleLeave = async () => {
    if (!selectedJourneyId) return;
    await withErrorNotice(async () => {
      await request(`/api/journeys/${selectedJourneyId}/leave`, { method: 'POST' });
      setDetails(null);
      setSelectedJourneyId(null);
      await loadCatalog();
    }, 'Left journey.');
  };

  const handleFail = async () => {
    if (!selectedJourneyId) return;
    await withErrorNotice(async () => {
      await request(`/api/journeys/${selectedJourneyId}/fail`, { method: 'POST' });
      await loadCatalog({ silent: true });
      await loadDetails(selectedJourneyId);
    }, 'Failure recorded and shared.');
  };

  const handleCheckIn = async (note?: string) => {
    if (!selectedJourneyId) return;
    await withErrorNotice(async () => {
      await request(`/api/journeys/${selectedJourneyId}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'checkIn', note }),
      });
      await loadDetails(selectedJourneyId, { silent: true });
    }, 'Daily check-in recorded.');
  };

  const handleInvite = async (input: { username?: string; email?: string }) => {
    if (!selectedJourneyId) return;

    await withErrorNotice(async () => {
      await request(`/api/journeys/${selectedJourneyId}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'invite', ...input }),
      });

      await loadDetails(selectedJourneyId, { silent: true });
    }, 'Invite created.');
  };

  const handleAddConsequence = async (input: {
    failureThreshold: number;
    description: string;
    consequenceType?: 'text' | 'symbolic' | 'warning' | 'penalty';
    symbol?: string;
  }) => {
    if (!selectedJourneyId) return;

    await withErrorNotice(async () => {
      await request(`/api/journeys/${selectedJourneyId}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'addConsequence', ...input }),
      });
      await loadDetails(selectedJourneyId, { silent: true });
    }, 'Consequence added.');
  };

  const handleEncourage = async (input: { toUserId?: string; emoji?: string; message?: string }) => {
    if (!selectedJourneyId) return;

    await withErrorNotice(async () => {
      await request(`/api/journeys/${selectedJourneyId}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'encourage', ...input }),
      });

      await loadDetails(selectedJourneyId, { silent: true });
    }, 'Encouragement sent.');
  };

  const handleEdit = () => {
    setIsEditOpen(true);
  };

  const handleEditSave = async (updates: {
    name: string;
    description?: string | null;
    rulesText?: string | null;
    consequenceRules?: string | null;
  }) => {
    if (!selectedJourneyId) return;

    await withErrorNotice(async () => {
      await request(`/api/journeys/${selectedJourneyId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      await loadDetails(selectedJourneyId);
    }, 'Journey updated.');
  };

  const handleDelete = async () => {
    if (!selectedJourneyId) return;

    await withErrorNotice(async () => {
      await request(`/api/journeys/${selectedJourneyId}`, {
        method: 'DELETE',
      });

      setDetails(null);
      setSelectedJourneyId(null);
      await loadCatalog();
    }, 'Journey deleted.');
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-start bg-surface-container-low p-6 md:p-8 rounded-xl border border-outline-variant/10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="font-headline text-2xl md:text-3xl font-black tracking-tight text-on-surface flex items-center lg:gap-3">
            <span className="text-primary hidden lg:inline">&gt;</span> 
            <span className="bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">COMPETITIVE RECOVERY</span>
          </h2>
          <p className="font-body text-sm md:text-base text-on-surface-variant max-w-2xl mt-3 leading-relaxed">
            Assemble your team, define strict rules, and fight together. Shared journeys feature transparent failures, live live rankings, automated consequences, and social accountability loops.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className={`mt-4 md:mt-0 relative z-10 px-5 py-3 rounded-lg font-headline font-bold text-xs md:text-sm uppercase tracking-wider transition-all duration-300 shadow-md flex items-center gap-2
            ${isCreating 
              ? 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/30' 
              : 'bg-primary text-on-primary hover:bg-primary/90 hover:scale-[1.02]'
            }
          `}
        >
          {isCreating ? 'Cancel Creation' : 'Forge New Arena'}
        </button>
      </header>

      {notice && (
        <div
          className={`px-4 py-3 rounded-lg border font-mono text-sm shadow-sm flex items-center gap-3 ${
            notice.type === 'success'
              ? 'bg-primary/10 border-primary/20 text-primary'
              : 'bg-error-container/20 border-error/30 text-error'
          }`}
        >
          <span className="font-bold text-lg">{notice.type === 'success' ? '✓' : '⚠'}</span>
          {notice.message}
        </div>
      )}

      {isCreating && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <CreateJourney onCreateJourney={(payload) => {
            setIsCreating(false);
            return handleCreateJourney(payload);
          }} />
        </div>
      )}

      {isEditOpen && details && (
        <EditJourney
          details={details}
          onClose={() => setIsEditOpen(false)}
          onSave={handleEditSave}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">
        <div className="space-y-4">
          {isCatalogLoading && (
            <div className="font-mono text-xs text-on-surface-variant">
              <span className="animate-blink text-primary">▊</span> syncing journeys...
            </div>
          )}

          <JourneyList
            catalog={catalog}
            selectedJourneyId={selectedJourneyId}
            onSelectJourney={setSelectedJourneyId}
            onJoinPublicJourney={(journeyId) => joinJourney(journeyId)}
            onRespondInvite={(journeyId, token, decision) =>
              joinJourney(journeyId, token, decision)
            }
          />
        </div>

        <JourneyDetails
          details={details}
          isLoading={isDetailsLoading}
          onJoin={() => (selectedJourneyId ? joinJourney(selectedJourneyId) : Promise.resolve())}
          onLeave={handleLeave}
          onFail={handleFail}
          onCheckIn={handleCheckIn}
          onInvite={handleInvite}
          onAddConsequence={handleAddConsequence}
          onEncourage={handleEncourage}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </section>
  );
}
