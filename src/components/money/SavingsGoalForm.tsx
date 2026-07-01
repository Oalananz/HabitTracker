'use client';

import { useState } from 'react';

interface SavingsGoalFormInitial {
  title?: string;
  targetAmount?: number | null;
  currentAmount?: number;
  currency?: string;
  targetDate?: string | null;
}

interface SavingsGoalFormProps {
  onSubmit: (data: { title: string; targetAmount: number; currentAmount: number; currency: string; targetDate: string }) => void;
  onCancel: () => void;
  initial?: SavingsGoalFormInitial;
}

export default function SavingsGoalForm({ onSubmit, onCancel, initial }: SavingsGoalFormProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [targetAmount, setTargetAmount] = useState(initial?.targetAmount?.toString() || '');
  const [currentAmount, setCurrentAmount] = useState(initial?.currentAmount?.toString() || '0');
  const [currency, setCurrency] = useState(initial?.currency || 'JOD');
  const [targetDate, setTargetDate] = useState(initial?.targetDate || '');

  const handleSubmit = () => {
    if (!title.trim() || !targetAmount) return;
    onSubmit({
      title: title.trim(),
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      currency: currency.trim() || 'JOD',
      targetDate,
    });
  };

  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 animate-fade-in space-y-4">
      <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
        <span className="text-primary">&gt;</span> {initial ? 'EDIT_SAVINGS_GOAL' : 'NEW_SAVINGS_GOAL'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; TITLE
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="e.g. Emergency fund, New laptop"
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; TARGET_AMOUNT
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; CURRENT_AMOUNT
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; CURRENCY
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="JOD"
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; TARGET_DATE (optional)
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body border-none p-0 focus:ring-0"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !targetAmount}
          className="px-5 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {initial ? 'SAVE CHANGES' : 'ADD GOAL'} &#8629;
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-surface-container-high text-on-surface-variant font-label text-xs uppercase rounded-sm hover:bg-surface-bright transition-colors"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
