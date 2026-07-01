'use client';

import { useState } from 'react';
import type { MoneyCategory, BillingCycle } from '@/lib/money';

interface SubscriptionFormInitial {
  title?: string;
  amount?: number | null;
  currency?: string;
  billingCycle?: BillingCycle | null;
  nextBillingDate?: string | null;
  categoryId?: string | null;
}

interface SubscriptionFormProps {
  categories: MoneyCategory[];
  onSubmit: (data: {
    title: string;
    amount: number;
    currency: string;
    billingCycle: BillingCycle;
    nextBillingDate: string;
    categoryId: string | null;
  }) => void;
  onCancel: () => void;
  initial?: SubscriptionFormInitial;
}

export default function SubscriptionForm({ categories, onSubmit, onCancel, initial }: SubscriptionFormProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [amount, setAmount] = useState(initial?.amount?.toString() || '');
  const [currency, setCurrency] = useState(initial?.currency || 'JOD');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initial?.billingCycle || 'monthly');
  const [nextBillingDate, setNextBillingDate] = useState(initial?.nextBillingDate || '');
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId || '');

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const handleSubmit = () => {
    if (!title.trim() || !amount) return;
    onSubmit({
      title: title.trim(),
      amount: parseFloat(amount),
      currency: currency.trim() || 'JOD',
      billingCycle,
      nextBillingDate,
      categoryId: categoryId || null,
    });
  };

  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 animate-fade-in space-y-4">
      <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
        <span className="text-primary">&gt;</span> {initial ? 'EDIT_SUBSCRIPTION' : 'NEW_SUBSCRIPTION'}
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
              placeholder="e.g. Netflix, Gym membership"
            />
          </div>
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

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; BILLING_CYCLE
          </label>
          <select
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm font-body focus:border-primary/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="monthly" className="bg-surface-container-lowest">Monthly</option>
            <option value="yearly" className="bg-surface-container-lowest">Yearly</option>
            <option value="weekly" className="bg-surface-container-lowest">Weekly</option>
            <option value="custom" className="bg-surface-container-lowest">Custom</option>
          </select>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; NEXT_BILLING_DATE
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="date"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
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
            <option value="" className="bg-surface-container-lowest">Uncategorized</option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id} className="bg-surface-container-lowest">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !amount}
          className="px-5 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {initial ? 'SAVE CHANGES' : 'ADD SUBSCRIPTION'} &#8629;
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
