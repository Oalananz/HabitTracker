'use client';

import { useEffect, useState, useCallback, useRef, type ChangeEvent } from 'react';
import dayjs from 'dayjs';
import EmptyState from '@/components/ui/EmptyState';
import ManualCourseLinkForm from '@/components/learning/ManualCourseLinkForm';
import { useToast } from '@/store/useToast';

interface LearningProvider {
  id: string;
  name: string;
  type: 'oauth' | 'api_key' | 'manual' | 'extension';
  website_url: string | null;
  is_enabled: boolean;
}

interface ConnectedAccount {
  id: string;
  provider_id: string;
  display_name: string | null;
  status: 'connected' | 'expired' | 'disconnected' | 'error';
  last_synced_at: string | null;
}

const UNSUPPORTED_MESSAGE =
  'This platform is not supported for automatic sync yet. You can still add the course link and track progress manually.';

interface CsvRow {
  title: string;
  courseUrl: string;
  provider: string;
  progressPercentage: number;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const rows = lines.slice(1); // skip header: title,courseUrl,provider,progressPercentage
  return rows.map((line) => {
    const [title = '', courseUrl = '', provider = '', progressPercentage = '0'] = line.split(',').map((v) => v.trim());
    return { title, courseUrl, provider, progressPercentage: parseInt(progressPercentage, 10) || 0 };
  }).filter((r) => r.title && r.courseUrl);
}

export default function LearningConnectionsPage() {
  const { addToast } = useToast();
  const [providers, setProviders] = useState<LearningProvider[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManualForm, setShowManualForm] = useState(false);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/learning/connections');
      const data = await res.json();
      setProviders(data.providers || []);
      setConnectedAccounts(data.connectedAccounts || []);
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const oauthProviders = providers.filter((p) => p.type !== 'manual');

  const handleUnsupportedConnect = () => {
    addToast(UNSUPPORTED_MESSAGE, 'info', 5000);
  };

  const handleManualLinkSubmit = async (data: {
    title: string;
    courseUrl: string;
    provider: string;
    progressPercentage: number;
    targetCompletionDate: string;
  }) => {
    await fetch('/api/learning/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'manual-link', ...data }),
    });
    setShowManualForm(false);
    addToast('Course link added — you can track progress from the Learning page.', 'success', 3000);
    fetchConnections();
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Disconnect this account? Any synced tokens will be cleared.')) return;
    await fetch('/api/learning/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'disconnect', accountId }),
    });
    fetchConnections();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvRows(parseCsv(text));
  };

  const handleConfirmCsvImport = async () => {
    setCsvImporting(true);
    try {
      for (const row of csvRows) {
        await fetch('/api/learning/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'manual-link',
            title: row.title,
            courseUrl: row.courseUrl,
            provider: row.provider,
            progressPercentage: row.progressPercentage,
          }),
        });
      }
      addToast(`Imported ${csvRows.length} course${csvRows.length === 1 ? '' : 's'}.`, 'success', 3000);
      setCsvRows([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchConnections();
    } finally {
      setCsvImporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-page-enter">
      <header>
        <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter text-on-surface mb-2">
          <span className="text-primary">&gt;</span> Learning Connections
        </h1>
        <p className="font-body text-on-surface-variant max-w-2xl">
          Connect supported learning platforms using official authorization. If a platform does not support
          connection, you can still track courses manually by adding the course link.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Supported Connections */}
        <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
              <span className="text-primary">&gt;</span> SUPPORTED_CONNECTIONS
            </h3>
          </div>
          {loading ? (
            <p className="font-mono text-xs text-on-surface-variant">Loading…</p>
          ) : oauthProviders.length === 0 ? (
            <EmptyState
              title="No OAuth providers yet"
              description="No platforms are configured for automatic sync in this version. Use a manual course link instead."
              icon="cloud_off"
            />
          ) : (
            <div className="space-y-2">
              {oauthProviders.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 bg-surface-container-lowest rounded-sm border border-outline-variant/10 p-3">
                  <div className="min-w-0">
                    <p className="font-body text-sm text-on-surface truncate">{p.name}</p>
                    <p className="font-mono text-[10px] text-outline">
                      {p.is_enabled ? 'Available' : 'Not yet available'}
                    </p>
                  </div>
                  <button
                    disabled={!p.is_enabled}
                    onClick={p.is_enabled ? undefined : handleUnsupportedConnect}
                    className="px-3 py-1.5 rounded-sm font-label text-[10px] uppercase tracking-wider bg-surface-container-high text-on-surface-variant hover:bg-surface-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    Connect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Manual Course Link */}
        <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
              <span className="text-primary">&gt;</span> MANUAL_COURSE_LINK
            </h3>
            <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] text-primary bg-primary/10 border border-primary/30">
              Available now
            </span>
          </div>
          <p className="font-body text-xs text-on-surface-variant">
            Works for any learning website — no login required. This is the universal fallback for tracking progress.
          </p>
          <button
            onClick={() => setShowManualForm((v) => !v)}
            className="w-fit flex items-center gap-2 px-4 py-2 bg-scanline-gradient text-on-primary font-headline font-bold text-xs uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[16px]">add_link</span>
            Add Course Link
          </button>
        </div>

        {/* 3. CSV / Manual Import */}
        <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
              <span className="text-primary">&gt;</span> CSV_/_MANUAL_IMPORT
            </h3>
            <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] text-primary bg-primary/10 border border-primary/30">
              Available now
            </span>
          </div>
          <p className="font-body text-xs text-on-surface-variant">
            Columns: <span className="font-mono">title, courseUrl, provider, progressPercentage</span>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="font-mono text-xs text-on-surface-variant file:mr-3 file:px-3 file:py-1.5 file:rounded-sm file:border-0 file:bg-surface-container-high file:text-on-surface file:text-xs file:uppercase file:tracking-wider file:cursor-pointer cursor-pointer"
          />
          {csvRows.length > 0 && (
            <div className="flex items-center justify-between gap-3 bg-surface-container-lowest rounded-sm border border-outline-variant/10 p-3">
              <p className="font-mono text-xs text-on-surface-variant">{csvRows.length} course{csvRows.length === 1 ? '' : 's'} ready to import</p>
              <button
                onClick={handleConfirmCsvImport}
                disabled={csvImporting}
                className="px-3 py-1.5 rounded-sm font-label text-[10px] uppercase tracking-wider bg-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {csvImporting ? 'Importing…' : 'Confirm Import'}
              </button>
            </div>
          )}
        </div>

        {/* 4. Browser Extension */}
        <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
              <span className="text-primary">&gt;</span> BROWSER_EXTENSION
            </h3>
            <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] text-outline border border-outline-variant/20">
              Coming soon
            </span>
          </div>
          <p className="font-body text-xs text-on-surface-variant">
            A future browser extension will let you sync progress from supported sites automatically, without ever asking for your password.
          </p>
          <button
            disabled
            className="w-fit flex items-center gap-2 px-4 py-2 bg-surface-container-high text-on-surface-variant font-headline font-bold text-xs uppercase tracking-wider rounded-sm opacity-50 cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px]">extension</span>
            Coming Soon
          </button>
        </div>
      </div>

      {showManualForm && (
        <ManualCourseLinkForm onSubmit={handleManualLinkSubmit} onCancel={() => setShowManualForm(false)} />
      )}

      {/* Connected accounts */}
      <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
        <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide mb-4">
          <span className="text-primary">&gt;</span> CONNECTED_ACCOUNTS
        </h3>
        {connectedAccounts.length === 0 ? (
          <EmptyState title="No connected accounts" description="Connected learning accounts will appear here once OAuth providers are available." icon="cloud_off" />
        ) : (
          <div className="space-y-2">
            {connectedAccounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-sm hover:bg-surface-container-high transition-colors">
                <div className="min-w-0">
                  <p className="font-body text-sm text-on-surface truncate">{acc.display_name || 'Connected account'}</p>
                  <p className="font-mono text-[10px] text-outline">
                    {acc.status.toUpperCase()}
                    {acc.last_synced_at && ` · last synced ${dayjs(acc.last_synced_at).format('MMM D, YYYY')}`}
                  </p>
                </div>
                {acc.status === 'connected' && (
                  <button
                    onClick={() => handleDisconnect(acc.id)}
                    className="px-3 py-1.5 rounded-sm font-label text-[10px] uppercase tracking-wider bg-error/10 text-error hover:bg-error/20 transition-colors flex-shrink-0"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
