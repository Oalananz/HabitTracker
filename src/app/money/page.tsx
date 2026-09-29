'use client';

import { useEffect, useState, useCallback, useMemo, useRef, type ComponentProps } from 'react';
import dayjs from 'dayjs';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import TransactionForm from '@/components/money/TransactionForm';
import BudgetForm from '@/components/money/BudgetForm';
import SavingsGoalForm from '@/components/money/SavingsGoalForm';
import DebtForm from '@/components/money/DebtForm';
import SubscriptionForm from '@/components/money/SubscriptionForm';
import ExpenseBreakdownChart from '@/components/money/ExpenseBreakdownChart';
import RowActions from '@/components/ui/RowActions';
import { useConfirm } from '@/components/ui/useConfirm';
import { useToast } from '@/store/useToast';
import { downloadCsv } from '@/lib/csvExport';
import {
  calculateSavingsProgress,
  calculateDebtProgress,
  calculateBudgetUsage,
  getExpenseByCategory,
  getUpcomingBills,
  type MoneyCategory,
  type MoneyTransaction,
  type Budget,
  type SavingsGoal,
  type Debt,
  type Subscription,
} from '@/lib/money';

interface MoneySummary {
  monthlyIncome: number;
  monthlyExpenses: number;
  netBalance: number;
  savingsThisMonth: number;
  budgetUsedPercentage: number;
  debtRemaining: number;
  upcomingBillsCount: number;
  activeSubscriptionsCount: number;
  currency: string;
  otherCurrencies?: string[];
}

type ActiveForm = 'income' | 'expense' | 'budget' | 'savings' | 'debt' | 'subscription' | null;
type DateRangeMode = 'this_month' | 'last_month' | 'custom';

const RANGE_LABELS: Record<DateRangeMode, string> = {
  this_month: 'This month',
  last_month: 'Last month',
  custom: 'Custom range',
};

type TransactionData = Parameters<ComponentProps<typeof TransactionForm>['onSubmit']>[0];
type BudgetData = Parameters<ComponentProps<typeof BudgetForm>['onSubmit']>[0];
type SavingsGoalData = Parameters<ComponentProps<typeof SavingsGoalForm>['onSubmit']>[0];
type DebtData = Parameters<ComponentProps<typeof DebtForm>['onSubmit']>[0];
type SubscriptionData = Parameters<ComponentProps<typeof SubscriptionForm>['onSubmit']>[0];

type Editing =
  | { kind: 'transaction'; item: MoneyTransaction }
  | { kind: 'budget'; item: Budget }
  | { kind: 'savings'; item: SavingsGoal }
  | { kind: 'debt'; item: Debt }
  | { kind: 'subscription'; item: Subscription };

// Update endpoint and id field per item kind.
const UPDATE_TARGETS: Record<Editing['kind'], { url: string; idField: string; noun: string }> = {
  transaction: { url: '/api/money/transactions', idField: 'transactionId', noun: 'transaction' },
  budget: { url: '/api/money/budgets', idField: 'budgetId', noun: 'budget' },
  savings: { url: '/api/money/savings-goals', idField: 'goalId', noun: 'savings goal' },
  debt: { url: '/api/money/debts', idField: 'debtId', noun: 'debt' },
  subscription: { url: '/api/money/subscriptions', idField: 'subscriptionId', noun: 'subscription' },
};

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** POST to a money API route; returns false (and toasts) on any failure. */
async function postAction(
  url: string,
  body: Record<string, unknown>,
  addToast: (msg: string, type: 'error') => void,
  failureMessage: string
): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      addToast(failureMessage, 'error');
      return false;
    }
    return true;
  } catch {
    addToast(failureMessage, 'error');
    return false;
  }
}

interface MoneyData {
  summary: MoneySummary | null;
  categories: MoneyCategory[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];
  subscriptions: Subscription[];
}

async function loadMoneyData(month: number, year: number): Promise<MoneyData> {
  const responses = await Promise.all([
    fetch('/api/money/summary'),
    fetch('/api/money/categories'),
    fetch(`/api/money/budgets?month=${month}&year=${year}`),
    fetch('/api/money/savings-goals'),
    fetch('/api/money/debts'),
    fetch('/api/money/subscriptions'),
  ]);
  const [summaryData, categoriesData, budgetsData, savingsData, debtsData, subsData] =
    await Promise.all(responses.map((r) => r.json()));
  return {
    summary: summaryData.summary ?? null,
    categories: categoriesData.categories || [],
    budgets: budgetsData.budgets || [],
    savingsGoals: savingsData.savingsGoals || [],
    debts: debtsData.debts || [],
    subscriptions: subsData.subscriptions || [],
  };
}

async function loadTransactions(query: string): Promise<MoneyTransaction[]> {
  const res = await fetch(`/api/money/transactions?${query}`);
  const data = await res.json();
  return data.transactions || [];
}

export default function MoneyPage() {
  const [summary, setSummary] = useState<MoneySummary | null>(null);
  const [transactions, setTransactions] = useState<MoneyTransaction[]>([]);
  const [categories, setCategories] = useState<MoneyCategory[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeForm, setActiveForm] = useState<ActiveForm>(null);
  const { confirm, ConfirmDialog } = useConfirm();
  const { addToast } = useToast();

  // Filters
  const [rangeMode, setRangeMode] = useState<DateRangeMode>('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');

  const now = dayjs();
  const currentMonth = now.month() + 1;
  const currentYear = now.year();

  const applyMoneyData = useCallback((data: MoneyData) => {
    setSummary(data.summary);
    setCategories(data.categories);
    setBudgets(data.budgets);
    setSavingsGoals(data.savingsGoals);
    setDebts(data.debts);
    setSubscriptions(data.subscriptions);
  }, []);

  // Refresh after a change; current data stays on screen while it reloads.
  const fetchAll = useCallback(async () => {
    try {
      applyMoneyData(await loadMoneyData(currentMonth, currentYear));
    } catch (err) {
      console.error('Failed to load money data:', err);
    }
  }, [applyMoneyData, currentMonth, currentYear]);

  useEffect(() => {
    let active = true;
    loadMoneyData(currentMonth, currentYear)
      .then((data) => { if (active) applyMoneyData(data); })
      .catch((err) => console.error('Failed to load money data:', err))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [applyMoneyData, currentMonth, currentYear]);

  const transactionsQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (rangeMode === 'this_month') {
      params.set('month', String(currentMonth));
      params.set('year', String(currentYear));
    } else if (rangeMode === 'last_month') {
      const last = dayjs().subtract(1, 'month');
      params.set('month', String(last.month() + 1));
      params.set('year', String(last.year()));
    } else if (rangeMode === 'custom') {
      if (customFrom) params.set('dateFrom', customFrom);
      if (customTo) params.set('dateTo', customTo);
    }
    if (filterType !== 'all') params.set('type', filterType);
    if (filterCategory !== 'all') params.set('categoryId', filterCategory);
    if (filterPaymentMethod !== 'all') params.set('paymentMethod', filterPaymentMethod);
    if (filterCurrency !== 'all') params.set('currency', filterCurrency);
    return params.toString();
  }, [rangeMode, customFrom, customTo, filterType, filterCategory, filterPaymentMethod, filterCurrency, currentMonth, currentYear]);

  // Latest filter query; results for an older query are discarded so a slow
  // response can't overwrite the list for filters chosen after it.
  const latestQuery = useRef(transactionsQuery);

  useEffect(() => {
    latestQuery.current = transactionsQuery;
    let active = true;
    loadTransactions(transactionsQuery)
      .then((rows) => { if (active) setTransactions(rows); })
      .catch((err) => console.error('Failed to load transactions:', err));
    return () => { active = false; };
  }, [transactionsQuery]);

  const fetchTransactions = useCallback(async () => {
    const query = latestQuery.current;
    try {
      const rows = await loadTransactions(query);
      if (latestQuery.current === query) setTransactions(rows);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  }, []);

  const [editing, setEditing] = useState<Editing | null>(null);
  const isEditing = (kind: Editing['kind'], id: string) => editing?.kind === kind && editing.item.id === id;
  const startEdit = (next: Editing) => {
    setActiveForm(null);
    setEditing(next);
  };
  const cancelEdit = () => setEditing(null);

  const closeForm = () => setActiveForm(null);
  const openForm = (form: ActiveForm) => {
    setEditing(null);
    setActiveForm(activeForm === form ? null : form);
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!editing) return;
    const target = UPDATE_TARGETS[editing.kind];
    const ok = await postAction(
      target.url,
      { action: 'update', [target.idField]: editing.item.id, ...data },
      addToast,
      `Failed to update ${target.noun}`
    );
    if (!ok) return;
    if (editing.kind === 'transaction') fetchTransactions();
    setEditing(null);
    fetchAll();
    addToast(`${target.noun[0].toUpperCase()}${target.noun.slice(1)} updated`, 'success', 2000);
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!(await confirm({ message: 'Delete this budget?' }))) return;
    const ok = await postAction('/api/money/budgets', { action: 'delete', budgetId }, addToast, 'Failed to delete budget');
    if (ok) fetchAll();
  };

  const handleCreateTransaction = async (data: TransactionData) => {
    const ok = await postAction('/api/money/transactions', { action: 'create', ...data }, addToast, 'Failed to save transaction');
    if (!ok) return;
    closeForm();
    fetchAll();
    fetchTransactions();
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!(await confirm({ message: 'Delete this transaction?' }))) return;
    const ok = await postAction('/api/money/transactions', { action: 'delete', transactionId }, addToast, 'Failed to delete transaction');
    if (!ok) return;
    fetchAll();
    fetchTransactions();
  };

  const handleCreateBudget = async (data: BudgetData) => {
    const ok = await postAction('/api/money/budgets', { action: 'create', ...data }, addToast, 'Failed to save budget');
    if (!ok) return;
    closeForm();
    fetchAll();
  };

  const handleCreateSavingsGoal = async (data: SavingsGoalData) => {
    const ok = await postAction('/api/money/savings-goals', { action: 'create', ...data }, addToast, 'Failed to save savings goal');
    if (!ok) return;
    closeForm();
    fetchAll();
  };

  const handleIncrementSavings = async (goalId: string) => {
    const amountStr = prompt('Add amount to this savings goal:');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) return;
    const ok = await postAction('/api/money/savings-goals', { action: 'increment', goalId, amount }, addToast, 'Failed to update savings goal');
    if (ok) fetchAll();
  };

  const handleDeleteSavingsGoal = async (goalId: string) => {
    if (!(await confirm({ message: 'Delete this savings goal?' }))) return;
    const ok = await postAction('/api/money/savings-goals', { action: 'delete', goalId }, addToast, 'Failed to delete savings goal');
    if (ok) fetchAll();
  };

  const handleCreateDebt = async (data: DebtData) => {
    const ok = await postAction('/api/money/debts', { action: 'create', ...data }, addToast, 'Failed to save debt');
    if (!ok) return;
    closeForm();
    fetchAll();
  };

  const handleDecrementDebt = async (debtId: string) => {
    const amountStr = prompt('Record a payment amount:');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) return;
    const ok = await postAction('/api/money/debts', { action: 'decrement', debtId, amount }, addToast, 'Failed to record payment');
    if (ok) fetchAll();
  };

  const handleDeleteDebt = async (debtId: string) => {
    if (!(await confirm({ message: 'Delete this debt?' }))) return;
    const ok = await postAction('/api/money/debts', { action: 'delete', debtId }, addToast, 'Failed to delete debt');
    if (ok) fetchAll();
  };

  const handleCreateSubscription = async (data: SubscriptionData) => {
    const ok = await postAction('/api/money/subscriptions', { action: 'create', ...data }, addToast, 'Failed to save subscription');
    if (!ok) return;
    closeForm();
    fetchAll();
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!(await confirm({ message: 'Delete this subscription?' }))) return;
    const ok = await postAction('/api/money/subscriptions', { action: 'delete', subscriptionId }, addToast, 'Failed to delete subscription');
    if (ok) fetchAll();
  };

  // Transactions are already limited to the selected date range by the API.
  const expenseByCategory = getExpenseByCategory(transactions, categories);

  const upcomingBills = getUpcomingBills(subscriptions, 7);
  const warningBudgets = budgets.filter((b) => calculateBudgetUsage(b, transactions).percentage > 90);

  const paymentMethods = Array.from(
    new Set(transactions.map((t) => t.paymentMethod).filter(Boolean))
  ) as string[];
  const currencies = Array.from(new Set(transactions.map((t) => t.currency)));

  const recentTransactions = transactions.slice(0, 10);

  const handleExportTransactions = () => {
    downloadCsv(
      `transactions-${dayjs().format('YYYY-MM-DD')}.csv`,
      transactions.map((t) => ({
        date: t.date,
        title: t.title,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        category: categories.find((c) => c.id === t.categoryId)?.name || '',
        paymentMethod: t.paymentMethod || '',
      }))
    );
  };

  return (
    <div className="space-y-8 animate-page-enter">
      {ConfirmDialog}
      <PageHeader
        title="Money"
        description="Track income, expenses, savings, and debt — all in one place."
      />

      {/* Budget warning banner */}
      {warningBudgets.length > 0 && (
        <div className="bg-error/10 border border-error/30 text-error rounded-md p-4 flex items-start gap-3">
          <span aria-hidden="true" className="material-symbols-outlined text-[20px] flex-shrink-0">warning</span>
          <div>
            <p className="font-headline text-sm font-semibold">Budget alert</p>
            <p className="font-body text-xs mt-1">
              {warningBudgets.length} budget{warningBudgets.length > 1 ? 's are' : ' is'} over 90% used this month.
            </p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      {loading ? (
        <div className="flex items-center gap-2 py-16 justify-center font-mono text-sm text-on-surface-variant">
          <span className="animate-blink text-primary">▊</span> Loading money data...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Monthly Income" value={fmt(summary?.monthlyIncome || 0)} unit={summary?.currency} icon="trending_up" />
          <StatCard label="Monthly Expenses" value={fmt(summary?.monthlyExpenses || 0)} unit={summary?.currency} icon="trending_down" />
          <StatCard
            label="Net Balance"
            value={fmt(summary?.netBalance || 0)}
            unit={summary?.currency}
            icon="account_balance_wallet"
            variant="primary"
          />
          <StatCard label="Savings This Month" value={fmt(summary?.savingsThisMonth || 0)} unit={summary?.currency} icon="savings" />
          <StatCard
            label="Budget Used"
            value={`${summary?.budgetUsedPercentage ?? 0}`}
            unit="%"
            icon="pie_chart"
            variant={(summary?.budgetUsedPercentage ?? 0) > 90 ? 'warning' : 'default'}
          />
          <StatCard label="Debt Remaining" value={fmt(summary?.debtRemaining || 0)} unit={summary?.currency} icon="credit_card" />
          <StatCard label="Upcoming Bills" value={summary?.upcomingBillsCount ?? 0} icon="event_upcoming" />
          <StatCard label="Subscriptions" value={summary?.activeSubscriptionsCount ?? 0} icon="subscriptions" />
          {summary?.otherCurrencies && summary.otherCurrencies.length > 0 && (
            <p className="col-span-2 md:col-span-4 text-xs text-on-surface-variant">
              Totals are in {summary.currency}. Entries in {summary.otherCurrencies.join(', ')} are not included.
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" icon="add" onClick={() => openForm('income')}>
          Add income
        </Button>
        <Button variant="secondary" icon="add" onClick={() => openForm('expense')}>
          Add expense
        </Button>
        <Button variant="secondary" icon="pie_chart" onClick={() => openForm('budget')}>
          Add budget
        </Button>
        <Button variant="secondary" icon="savings" onClick={() => openForm('savings')}>
          Add savings goal
        </Button>
        <Button variant="secondary" icon="credit_card" onClick={() => openForm('debt')}>
          Add debt
        </Button>
        <Button variant="secondary" icon="receipt_long" onClick={() => openForm('subscription')}>
          Add subscription
        </Button>
      </div>

      {/* Inline forms */}
      {activeForm === 'income' && (
        <TransactionForm
          categories={categories}
          initial={{ type: 'income' }}
          onSubmit={handleCreateTransaction}
          onCancel={closeForm}
        />
      )}
      {activeForm === 'expense' && (
        <TransactionForm
          categories={categories}
          initial={{ type: 'expense' }}
          onSubmit={handleCreateTransaction}
          onCancel={closeForm}
        />
      )}
      {activeForm === 'budget' && (
        <BudgetForm categories={categories} onSubmit={handleCreateBudget} onCancel={closeForm} />
      )}
      {activeForm === 'savings' && <SavingsGoalForm onSubmit={handleCreateSavingsGoal} onCancel={closeForm} />}
      {activeForm === 'debt' && <DebtForm onSubmit={handleCreateDebt} onCancel={closeForm} />}
      {activeForm === 'subscription' && (
        <SubscriptionForm categories={categories} onSubmit={handleCreateSubscription} onCancel={closeForm} />
      )}

      {/* Expense breakdown chart */}
      <ExpenseBreakdownChart data={expenseByCategory} periodLabel={RANGE_LABELS[rangeMode]} />

      {/* Filters */}
      <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-4 space-y-3">
        <h3 className="font-headline text-sm font-semibold text-on-surface">Filters</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Select
            value={rangeMode}
            onChange={(e) => setRangeMode(e.target.value as DateRangeMode)}
            className="text-xs py-2"
          >
            <option value="this_month">This month</option>
            <option value="last_month">Last month</option>
            <option value="custom">Custom range</option>
          </Select>
          {rangeMode === 'custom' && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-on-surface text-xs font-body focus:border-primary/50 transition-colors"
              />
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2 text-on-surface text-xs font-body focus:border-primary/50 transition-colors"
              />
            </>
          )}
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="text-xs py-2">
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </Select>
          <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="text-xs py-2">
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select value={filterPaymentMethod} onChange={(e) => setFilterPaymentMethod(e.target.value)} className="text-xs py-2">
            <option value="all">All payment methods</option>
            {paymentMethods.map((pm) => (
              <option key={pm} value={pm}>{pm}</option>
            ))}
          </Select>
          <Select value={filterCurrency} onChange={(e) => setFilterCurrency(e.target.value)} className="text-xs py-2">
            <option value="all">All currencies</option>
            {currencies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
        <SectionHeader
          title="Recent transactions"
          rightContent={
            transactions.length > 0 ? (
              <button onClick={handleExportTransactions} className="text-primary hover:underline flex items-center gap-1">
                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">download</span>
                Export CSV
              </button>
            ) : undefined
          }
        />
        {recentTransactions.length === 0 ? (
          <EmptyState compact title="No transactions" description="Add an income or expense to get started." />
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((t) => isEditing('transaction', t.id) ? (
              <TransactionForm
                key={t.id}
                editing
                categories={categories}
                initial={t}
                onSubmit={handleUpdate}
                onCancel={cancelEdit}
              />
            ) : (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-sm hover:bg-surface-container-high transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span aria-hidden="true"
                    className={`material-symbols-outlined text-[18px] flex-shrink-0 ${
                      t.type === 'income' ? 'text-primary' : t.type === 'expense' ? 'text-error' : 'text-secondary'
                    }`}
                  >
                    {t.type === 'income' ? 'trending_up' : t.type === 'expense' ? 'trending_down' : 'swap_horiz'}
                  </span>
                  <div className="min-w-0">
                    <p className="font-body text-sm text-on-surface truncate">{t.title}</p>
                    <p className="font-mono text-[10px] text-outline">{dayjs(t.date).format('MMM D, YYYY')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`font-mono text-sm whitespace-nowrap ${
                      t.type === 'income' ? 'text-primary' : t.type === 'expense' ? 'text-error' : 'text-on-surface-variant'
                    }`}
                  >
                    {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}
                    {fmt(t.amount)} {t.currency}
                  </span>
                  <RowActions
                    itemLabel={`transaction ${t.title}`}
                    onEdit={() => startEdit({ kind: 'transaction', item: t })}
                    onDelete={() => handleDeleteTransaction(t.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budgets */}
      <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
        <SectionHeader title="Budgets" rightContent="This month" />
        {budgets.length === 0 ? (
          <EmptyState compact title="No budgets" description="Set a monthly limit, overall or per category." />
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => {
              if (isEditing('budget', budget.id)) {
                return (
                  <BudgetForm key={budget.id} editing categories={categories} initial={budget} onSubmit={handleUpdate} onCancel={cancelEdit} />
                );
              }
              const usage = calculateBudgetUsage(budget, transactions);
              const name = budget.categoryId
                ? categories.find((c) => c.id === budget.categoryId)?.name || 'Category'
                : 'Overall';
              return (
                <div key={budget.id} className="bg-surface-container-lowest rounded-sm border border-outline-variant/10 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-headline text-sm font-bold text-on-surface">{name}</p>
                      <p className="font-mono text-[10px] text-outline mt-0.5">
                        {fmt(usage.spentAmount)} spent of {fmt(budget.amount)} {budget.currency}
                      </p>
                    </div>
                    <RowActions
                      itemLabel={`budget ${name}`}
                      onEdit={() => startEdit({ kind: 'budget', item: budget })}
                      onDelete={() => handleDeleteBudget(budget.id)}
                    />
                  </div>
                  <div className="h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${usage.percentage > 90 ? 'bg-error' : 'bg-scanline-gradient'}`}
                      style={{ width: `${Math.min(100, usage.percentage)}%` }}
                    />
                  </div>
                  <p className="font-mono text-[10px] text-on-surface-variant mt-1">{usage.percentage}% used</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Savings goals */}
      <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
        <SectionHeader title="Savings goals" />
        {savingsGoals.length === 0 ? (
          <EmptyState compact title="No savings goals" description="Set a savings target to start tracking progress." />
        ) : (
          <div className="space-y-3">
            {savingsGoals.map((goal) => {
              const progress = calculateSavingsProgress(goal);
              if (isEditing('savings', goal.id)) {
                return <SavingsGoalForm key={goal.id} editing initial={goal} onSubmit={handleUpdate} onCancel={cancelEdit} />;
              }
              return (
                <div key={goal.id} className="bg-surface-container-lowest rounded-sm border border-outline-variant/10 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-headline text-sm font-bold text-on-surface">{goal.title}</p>
                      <p className="font-mono text-[10px] text-outline mt-0.5">
                        {fmt(goal.currentAmount)} / {goal.targetAmount ? fmt(goal.targetAmount) : '—'} {goal.currency}
                        {goal.targetDate && ` · due ${dayjs(goal.targetDate).format('MMM D, YYYY')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleIncrementSavings(goal.id)}
                        className="w-7 h-7 rounded-sm bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                        aria-label="Add funds"  title="Add funds"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                      <RowActions
                        itemLabel={`savings goal ${goal.title}`}
                        onEdit={() => startEdit({ kind: 'savings', item: goal })}
                        onDelete={() => handleDeleteSavingsGoal(goal.id)}
                      />
                    </div>
                  </div>
                  <div className="h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                    <div className="h-full bg-scanline-gradient rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="font-mono text-[10px] text-on-surface-variant mt-1">{progress}% {goal.status === 'completed' ? '· Completed' : ''}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Debts */}
      <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
        <SectionHeader title="Debts" />
        {debts.length === 0 ? (
          <EmptyState compact title="No debts" description="Track loans and balances you're paying off here." />
        ) : (
          <div className="space-y-3">
            {debts.map((debt) => {
              const progress = calculateDebtProgress(debt);
              if (isEditing('debt', debt.id)) {
                return <DebtForm key={debt.id} editing initial={debt} onSubmit={handleUpdate} onCancel={cancelEdit} />;
              }
              return (
                <div key={debt.id} className="bg-surface-container-lowest rounded-sm border border-outline-variant/10 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-headline text-sm font-bold text-on-surface">{debt.title}</p>
                      <p className="font-mono text-[10px] text-outline mt-0.5">
                        {fmt(debt.remainingAmount ?? 0)} remaining of {fmt(debt.totalAmount ?? 0)} {debt.currency}
                        {debt.dueDate && ` · due ${dayjs(debt.dueDate).format('MMM D, YYYY')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDecrementDebt(debt.id)}
                        className="w-7 h-7 rounded-sm bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                        aria-label="Record payment"  title="Record payment"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-[16px]">payments</span>
                      </button>
                      <RowActions
                        itemLabel={`debt ${debt.title}`}
                        onEdit={() => startEdit({ kind: 'debt', item: debt })}
                        onDelete={() => handleDeleteDebt(debt.id)}
                      />
                    </div>
                  </div>
                  <div className="h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                    <div className="h-full bg-scanline-gradient rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="font-mono text-[10px] text-on-surface-variant mt-1">{progress}% paid off {debt.status === 'paid' ? '· Paid' : ''}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subscriptions */}
      <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
        <SectionHeader title="Subscriptions" />
        {subscriptions.length === 0 ? (
          <EmptyState compact title="No subscriptions" description="Track recurring bills and upcoming charges." />
        ) : (
          <div className="space-y-2">
            {subscriptions.map((sub) => {
              const isUpcoming = upcomingBills.some((b) => b.id === sub.id);
              if (isEditing('subscription', sub.id)) {
                return (
                  <SubscriptionForm key={sub.id} editing categories={categories} initial={sub} onSubmit={handleUpdate} onCancel={cancelEdit} />
                );
              }
              return (
                <div
                  key={sub.id}
                  className={`flex items-center justify-between gap-3 py-2.5 px-3 rounded-sm transition-colors ${
                    isUpcoming ? 'bg-tertiary/5 border border-tertiary/20' : 'hover:bg-surface-container-high'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span aria-hidden="true" className={`material-symbols-outlined text-[18px] flex-shrink-0 ${isUpcoming ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                      receipt_long
                    </span>
                    <div className="min-w-0">
                      <p className="font-body text-sm text-on-surface truncate">{sub.title}</p>
                      <p className="font-mono text-[10px] text-outline">
                        {sub.billingCycle} {sub.nextBillingDate && `· next ${dayjs(sub.nextBillingDate).format('MMM D, YYYY')}`}
                        {!sub.isActive && ' · Inactive'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-sm text-on-surface-variant whitespace-nowrap">
                      {fmt(sub.amount ?? 0)} {sub.currency}
                    </span>
                    <RowActions
                      itemLabel={`subscription ${sub.title}`}
                      onEdit={() => startEdit({ kind: 'subscription', item: sub })}
                      onDelete={() => handleDeleteSubscription(sub.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Money Review (coming soon) */}
      <div className="flex flex-col items-start gap-2">
        <Button variant="secondary" icon="auto_awesome" disabled>
          AI money review
        </Button>
        <p className="text-xs text-on-surface-variant/60">
          Coming soon: AI will analyze your spending and suggest budget improvements.
        </p>
      </div>
    </div>
  );
}
