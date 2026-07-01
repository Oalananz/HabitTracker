'use client';

import { useState } from 'react';
import type { MoneyCategory, MoneyTransactionType } from '@/lib/money';

interface TransactionFormInitial {
  type?: MoneyTransactionType;
  title?: string;
  amount?: number;
  currency?: string;
  categoryId?: string | null;
  date?: string;
  paymentMethod?: string | null;
  description?: string | null;
  isRecurring?: boolean;
}

interface TransactionFormProps {
  categories: MoneyCategory[];
  onSubmit: (data: {
    type: MoneyTransactionType;
    title: string;
    amount: number;
    currency: string;
    categoryId: string | null;
    date: string;
    paymentMethod: string;
    description: string;
    isRecurring: boolean;
  }) => void;
  onCancel: () => void;
  initial?: TransactionFormInitial;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function TransactionForm({ categories, onSubmit, onCancel, initial }: TransactionFormProps) {
  const [type, setType] = useState<MoneyTransactionType>(initial?.type || 'expense');
  const [title, setTitle] = useState(initial?.title || '');
  const [amount, setAmount] = useState(initial?.amount?.toString() || '');
  const [currency, setCurrency] = useState(initial?.currency || 'JOD');
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId || '');
  const [date, setDate] = useState(initial?.date || todayStr());
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [isRecurring, setIsRecurring] = useState(initial?.isRecurring || false);

  const filteredCategories = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'));

  const handleSubmit = () => {
    if (!title.trim() || !amount) return;
    onSubmit({
      type,
      title: title.trim(),
      amount: parseFloat(amount),
      currency: currency.trim() || 'JOD',
      categoryId: categoryId || null,
      date,
      paymentMethod: paymentMethod.trim(),
      description: description.trim(),
      isRecurring,
    });
  };

  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 animate-fade-in space-y-4">
      <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
        <span className="text-primary">&gt;</span> {initial ? 'EDIT_TRANSACTION' : 'NEW_TRANSACTION'}
      </h3>

      <div>
        <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
          &gt; TYPE
        </label>
        <div className="flex gap-2">
          {(['income', 'expense', 'transfer'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-sm font-label text-xs uppercase tracking-wider transition-colors ${
                type === t
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-bright'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
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
              placeholder="e.g. Grocery run, Salary"
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
            &gt; CATEGORY
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm font-body focus:border-primary/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="" className="bg-surface-container-lowest">Uncategorized</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id} className="bg-surface-container-lowest">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; DATE
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body border-none p-0 focus:ring-0"
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; PAYMENT_METHOD (optional)
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="text"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="Cash, Card, Bank transfer..."
            />
          </div>
        </div>
      </div>

      <div>
        <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
          &gt; NOTES (optional)
        </label>
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 focus-within:border-primary/50 transition-colors">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0 resize-none"
            rows={2}
            placeholder="Details about this transaction..."
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="w-4 h-4 rounded-sm accent-primary cursor-pointer"
        />
        <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Recurring</span>
      </label>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !amount}
          className="px-5 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {initial ? 'SAVE CHANGES' : 'ADD TRANSACTION'} &#8629;
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
