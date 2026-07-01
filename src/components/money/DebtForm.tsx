'use client';

import { useState } from 'react';

interface DebtFormInitial {
  title?: string;
  totalAmount?: number | null;
  remainingAmount?: number | null;
  currency?: string;
  monthlyPayment?: number | null;
  dueDate?: string | null;
}

interface DebtFormProps {
  onSubmit: (data: {
    title: string;
    totalAmount: number;
    remainingAmount: number;
    currency: string;
    monthlyPayment: number | undefined;
    dueDate: string;
  }) => void;
  onCancel: () => void;
  initial?: DebtFormInitial;
}

export default function DebtForm({ onSubmit, onCancel, initial }: DebtFormProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [totalAmount, setTotalAmount] = useState(initial?.totalAmount?.toString() || '');
  const [remainingAmount, setRemainingAmount] = useState(initial?.remainingAmount?.toString() || '');
  const [currency, setCurrency] = useState(initial?.currency || 'JOD');
  const [monthlyPayment, setMonthlyPayment] = useState(initial?.monthlyPayment?.toString() || '');
  const [dueDate, setDueDate] = useState(initial?.dueDate || '');

  const handleSubmit = () => {
    if (!title.trim() || !totalAmount) return;
    onSubmit({
      title: title.trim(),
      totalAmount: parseFloat(totalAmount),
      remainingAmount: remainingAmount ? parseFloat(remainingAmount) : parseFloat(totalAmount),
      currency: currency.trim() || 'JOD',
      monthlyPayment: monthlyPayment ? parseFloat(monthlyPayment) : undefined,
      dueDate,
    });
  };

  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 animate-fade-in space-y-4">
      <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
        <span className="text-primary">&gt;</span> {initial ? 'EDIT_DEBT' : 'NEW_DEBT'}
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
              placeholder="e.g. Car loan, Credit card"
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; TOTAL_AMOUNT
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; REMAINING_AMOUNT
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={remainingAmount}
              onChange={(e) => setRemainingAmount(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="defaults to total"
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; MONTHLY_PAYMENT (optional)
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; DUE_DATE (optional)
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body border-none p-0 focus:ring-0"
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
          disabled={!title.trim() || !totalAmount}
          className="px-5 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {initial ? 'SAVE CHANGES' : 'ADD DEBT'} &#8629;
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
