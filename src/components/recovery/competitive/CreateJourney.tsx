'use client';

import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import type { JourneyVisibility, StructuredJourneyRules } from './types';

interface ConsequenceDraft {
  failureThreshold: string;
  description: string;
  consequenceType: 'text' | 'symbolic' | 'warning' | 'penalty';
  symbol: string;
}

interface CreateJourneyPayload {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  rulesText?: string;
  rules: StructuredJourneyRules;
  maxFailures?: number | null;
  consequenceRules?: string;
  visibility: JourneyVisibility;
  consequences: Array<{
    failureThreshold: number;
    description: string;
    consequenceType: 'text' | 'symbolic' | 'warning' | 'penalty';
    symbol?: string;
  }>;
}

interface CreateJourneyProps {
  onCreateJourney: (payload: CreateJourneyPayload) => Promise<void>;
}

const emptyConsequence = (): ConsequenceDraft => ({
  failureThreshold: '',
  description: '',
  consequenceType: 'text',
  symbol: '',
});

export default function CreateJourney({ onCreateJourney }: CreateJourneyProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));
  const [endDate, setEndDate] = useState('');
  const [visibility, setVisibility] = useState<JourneyVisibility>('private');
  const [rulesText, setRulesText] = useState('');
  const [maxFailures, setMaxFailures] = useState('');
  const [consequenceRules, setConsequenceRules] = useState('');

  const [noMoreThanFailuresPerWeek, setNoMoreThanFailuresPerWeek] = useState('');
  const [resetStreakOnFailure, setResetStreakOnFailure] = useState(true);
  const [mandatoryDailyCheckIn, setMandatoryDailyCheckIn] = useState(false);
  const [syncToPersonal, setSyncToPersonal] = useState(false);

  const [consequences, setConsequences] = useState<ConsequenceDraft[]>([emptyConsequence()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => name.trim().length > 0 && !isSubmitting, [name, isSubmitting]);

  const updateConsequence = (index: number, patch: Partial<ConsequenceDraft>) => {
    setConsequences((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const parsedWeeklyLimit = noMoreThanFailuresPerWeek
      ? Number(noMoreThanFailuresPerWeek)
      : undefined;

    const rules: StructuredJourneyRules = {
      resetStreakOnFailure,
      mandatoryDailyCheckIn,
      syncToPersonal,
      ...(Number.isFinite(parsedWeeklyLimit) && parsedWeeklyLimit! > 0
        ? { noMoreThanFailuresPerWeek: Math.floor(parsedWeeklyLimit!) }
        : {}),
    };

    const payload: CreateJourneyPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      rulesText: rulesText.trim() || undefined,
      rules,
      maxFailures: maxFailures ? Number(maxFailures) : null,
      consequenceRules: consequenceRules.trim() || undefined,
      visibility,
      consequences: consequences
        .filter((row) => row.description.trim() && Number(row.failureThreshold) > 0)
        .map((row) => ({
          failureThreshold: Math.floor(Number(row.failureThreshold)),
          description: row.description.trim(),
          consequenceType: row.consequenceType,
          symbol: row.symbol.trim() || undefined,
        })),
    };

    setIsSubmitting(true);
    try {
      await onCreateJourney(payload);
      setName('');
      setDescription('');
      setStartDate(dayjs().format('YYYY-MM-DDTHH:mm'));
      setEndDate('');
      setVisibility('private');
      setRulesText('');
      setMaxFailures('');
      setConsequenceRules('');
      setNoMoreThanFailuresPerWeek('');
      setResetStreakOnFailure(true);
      setMandatoryDailyCheckIn(false);
      setSyncToPersonal(false);
      setConsequences([emptyConsequence()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 space-y-4">
      <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
        <span className="text-primary">&gt;</span> CREATE_COMPETITIVE_JOURNEY
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1.5">
            Journey Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-sm text-on-surface"
            placeholder="Discipline Sprint / No PM Relapse"
          />
        </div>
        <div>
          <label className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1.5">
            Visibility
          </label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as JourneyVisibility)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-sm text-on-surface"
          >
            <option value="private">Private (invite-only)</option>
            <option value="public">Public (discoverable)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-sm text-on-surface"
          placeholder="What this group is fighting for"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1.5">
            Start Date
          </label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-sm text-on-surface"
          />
        </div>
        <div>
          <label className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1.5">
            End Date (optional)
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-sm text-on-surface"
          />
        </div>
        <div>
          <label className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1.5">
            Max Allowed Failures
          </label>
          <input
            type="number"
            min={0}
            value={maxFailures}
            onChange={(e) => setMaxFailures(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-sm text-on-surface"
            placeholder="e.g. 5"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1.5">
            Rule Text Summary
          </label>
          <textarea
            value={rulesText}
            onChange={(e) => setRulesText(e.target.value)}
            rows={3}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-sm text-on-surface"
            placeholder="Example: strict zero-excuse policy, public accountability every day"
          />
        </div>
        <div>
          <label className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1.5">
            Consequence Rule Notes
          </label>
          <textarea
            value={consequenceRules}
            onChange={(e) => setConsequenceRules(e.target.value)}
            rows={3}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-sm text-on-surface"
            placeholder="Example: 3 failures = donate $10, 5 failures = failed journey"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant block mb-1.5">
            Failure Limit / Week
          </label>
          <input
            type="number"
            min={1}
            value={noMoreThanFailuresPerWeek}
            onChange={(e) => setNoMoreThanFailuresPerWeek(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-sm text-on-surface"
            placeholder="Optional"
          />
        </div>

        <label className="flex items-center gap-2 text-xs font-label uppercase tracking-wider text-on-surface-variant">
          <input
            type="checkbox"
            checked={resetStreakOnFailure}
            onChange={(e) => setResetStreakOnFailure(e.target.checked)}
          />
          Reset streak on fail
        </label>

        <label className="flex items-center gap-2 text-xs font-label uppercase tracking-wider text-on-surface-variant">
          <input
            type="checkbox"
            checked={mandatoryDailyCheckIn}
            onChange={(e) => setMandatoryDailyCheckIn(e.target.checked)}
          />
          Daily check-in required
        </label>

        <label className="flex items-center gap-2 text-xs font-label uppercase tracking-wider text-on-surface-variant">
          <input
            type="checkbox"
            checked={syncToPersonal}
            onChange={(e) => setSyncToPersonal(e.target.checked)}
          />
          Sync fails to personal log
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant">
            Consequence Thresholds
          </div>
          <button
            onClick={() => setConsequences((prev) => [...prev, emptyConsequence()])}
            className="px-2.5 py-1 rounded-sm bg-surface-container-high text-on-surface-variant text-[10px] font-label uppercase"
          >
            + Add
          </button>
        </div>

        {consequences.map((row, index) => (
          <div
            key={`consequence-${index}`}
            className="grid grid-cols-1 md:grid-cols-5 gap-2 p-2 rounded-sm bg-surface-container-lowest border border-outline-variant/15"
          >
            <input
              type="number"
              min={1}
              value={row.failureThreshold}
              onChange={(e) => updateConsequence(index, { failureThreshold: e.target.value })}
              className="bg-surface-container-low border border-outline-variant/20 rounded-sm px-2 py-1.5 text-sm text-on-surface"
              placeholder="Threshold"
            />
            <input
              value={row.description}
              onChange={(e) => updateConsequence(index, { description: e.target.value })}
              className="md:col-span-2 bg-surface-container-low border border-outline-variant/20 rounded-sm px-2 py-1.5 text-sm text-on-surface"
              placeholder="Consequence description"
            />
            <select
              value={row.consequenceType}
              onChange={(e) =>
                updateConsequence(index, {
                  consequenceType: e.target.value as ConsequenceDraft['consequenceType'],
                })
              }
              className="bg-surface-container-low border border-outline-variant/20 rounded-sm px-2 py-1.5 text-sm text-on-surface"
            >
              <option value="text">text</option>
              <option value="symbolic">symbolic</option>
              <option value="warning">warning</option>
              <option value="penalty">penalty</option>
            </select>
            <div className="flex gap-2">
              <input
                value={row.symbol}
                onChange={(e) => updateConsequence(index, { symbol: e.target.value })}
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-sm px-2 py-1.5 text-sm text-on-surface"
                placeholder="Symbol"
              />
              <button
                onClick={() =>
                  setConsequences((prev) =>
                    prev.length === 1 ? [emptyConsequence()] : prev.filter((_, i) => i !== index)
                  )
                }
                className="px-2.5 py-1 rounded-sm bg-error-container text-on-error-container text-[10px] font-label uppercase"
              >
                X
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="px-4 py-2.5 rounded-sm bg-scanline-gradient text-on-primary font-headline font-bold text-xs uppercase tracking-wider disabled:opacity-50"
      >
        {isSubmitting ? 'Creating...' : 'Create Competitive Journey'}
      </button>
    </div>
  );
}
