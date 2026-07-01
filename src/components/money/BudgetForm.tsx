'use client';

import { useState } from 'react';
import type { MoneyCategory } from '@/lib/money';

interface BudgetFormInitial {
  month?: number;
  year?: number;
  categoryId?: string | null;
  amount?: number;
  currency?: string;
}

interface BudgetFormProps {
  categories: MoneyCategory[];
  onSubmit: (data: { month: number; year: number; categoryId: string | null; amount: number; currency: string }) => void;
  onCancel: () => void;
  initial?: BudgetFormInitial;
}

const now = new Date();

export default function BudgetForm({ categories, onSubmit, onCancel, initial }: BudgetFormProps) {
  const initialMonthStr =
    initial?.month && initial?.year
      ? `${initial.year}-${String(initial.month).padStart(2, '0')}`
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [monthStr, setMonthStr] = useState(initialMonthStr);
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId || '');
  const [amount, setAmount] = useState(initial?.amount?.toString() || '');
  const [currency, setCurrency] = useState(initial?.currency || 'JOD');

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const handleSubmit = () => {
    if (!amount || !monthStr) return;
    const [yearStr, monthPart] = monthStr.split('-');
    onSubmit({
      month: parseInt(monthPart),
      year: parseInt(yearStr),
      categoryId: categoryId || null,
      amount: parseFloat(amount),
      currency: currency.trim() || 'JOD',
    });
  };

  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 animate-fade-in space-y-4">
      <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
        <span className="text-primary">&gt;</span> {initial ? 'EDIT_BUDGET' : 'NEW_BUDGET'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; MONTH
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="month"
              value={monthStr}
              onChange={(e) => setMonthStr(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body border-none p-0 focus:ring-0"
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; CATEGORY (optional)
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm font-body focus:border-primary/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="" className="bg-surface-container-lowest">Overall</option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id} className="bg-surface-container-lowest">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; AMOUNT
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!amount}
          className="px-5 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {initial ? 'SAVE CHANGES' : 'ADD BUDGET'} &#8629;
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
