'use client';

import { useEffect, useState, useCallback, type ComponentProps } from 'react';
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
}

type ActiveForm = 'income' | 'expense' | 'budget' | 'savings' | 'debt' | 'subscription' | null;
type DateRangeMode = 'this_month' | 'last_month' | 'custom';

type TransactionData = Parameters<ComponentProps<typeof TransactionForm>['onSubmit']>[0];
type BudgetData = Parameters<ComponentProps<typeof BudgetForm>['onSubmit']>[0];
type SavingsGoalData = Parameters<ComponentProps<typeof SavingsGoalForm>['onSubmit']>[0];
type DebtData = Parameters<ComponentProps<typeof DebtForm>['onSubmit']>[0];
type SubscriptionData = Parameters<ComponentProps<typeof SubscriptionForm>['onSubmit']>[0];

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

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, categoriesRes, budgetsRes, savingsRes, debtsRes, subsRes] = await Promise.all([
        fetch('/api/money/summary'),
        fetch('/api/money/categories'),
        fetch(`/api/money/budgets?month=${currentMonth}&year=${currentYear}`),
        fetch('/api/money/savings-goals'),
        fetch('/api/money/debts'),
        fetch('/api/money/subscriptions'),
      ]);

      const [summaryData, categoriesData, budgetsData, savingsData, debtsData, subsData] = await Promise.all([
        summaryRes.json(),
        categoriesRes.json(),
        budgetsRes.json(),
        savingsRes.json(),
        debtsRes.json(),
        subsRes.json(),
      ]);

      setSummary(summaryData.summary);
      setCategories(categoriesData.categories || []);
      setBudgets(budgetsData.budgets || []);
      setSavingsGoals(savingsData.savingsGoals || []);
      setDebts(debtsData.debts || []);
      setSubscriptions(subsData.subscriptions || []);
    } catch (err) {
      console.error('Failed to load money data:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTransactions = useCallback(async () => {
    const params = new URLSearchParams();
    if (rangeMode === 'this_month') {
      params.set('month', String(currentMonth));
      params.set('year', String(currentYear));
    } else if (rangeMode === 'last_month') {
      const last = now.subtract(1, 'month');
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

    try {
      const res = await fetch(`/api/money/transactions?${params.toString()}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeMode, customFrom, customTo, filterType, filterCategory, filterPaymentMethod, filterCurrency]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const closeForm = () => setActiveForm(null);

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

  const expenseByCategory = getExpenseByCategory(
    transactions.filter((t) => rangeMode === 'this_month'),
    categories
  );

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
          <span className="material-symbols-outlined text-[20px] flex-shrink-0">warning</span>
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
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" icon="add" onClick={() => setActiveForm(activeForm === 'income' ? null : 'income')}>
          Add income
        </Button>
        <Button variant="secondary" icon="add" onClick={() => setActiveForm(activeForm === 'expense' ? null : 'expense')}>
          Add expense
        </Button>
        <Button variant="secondary" icon="pie_chart" onClick={() => setActiveForm(activeForm === 'budget' ? null : 'budget')}>
          Add budget
        </Button>
        <Button variant="secondary" icon="savings" onClick={() => setActiveForm(activeForm === 'savings' ? null : 'savings')}>
          Add savings goal
        </Button>
        <Button variant="secondary" icon="credit_card" onClick={() => setActiveForm(activeForm === 'debt' ? null : 'debt')}>
          Add debt
        </Button>
        <Button variant="secondary" icon="receipt_long" onClick={() => setActiveForm(activeForm === 'subscription' ? null : 'subscription')}>
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
      <ExpenseBreakdownChart data={expenseByCategory} />

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
                <span className="material-symbols-outlined text-[14px]">download</span>
                Export CSV
              </button>
            ) : undefined
          }
        />
        {recentTransactions.length === 0 ? (
          <EmptyState compact title="No transactions" description="Add an income or expense to get started." />
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-sm hover:bg-surface-container-high transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
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
                  <button
                    onClick={() => handleDeleteTransaction(t.id)}
                    className="text-outline hover:text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              </div>
            ))}
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
                        title="Add funds"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSavingsGoal(goal.id)}
                        className="text-outline hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
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
                        title="Record payment"
                      >
                        <span className="material-symbols-outlined text-[16px]">payments</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDebt(debt.id)}
                        className="text-outline hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
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
              return (
                <div
                  key={sub.id}
                  className={`flex items-center justify-between gap-3 py-2.5 px-3 rounded-sm transition-colors ${
                    isUpcoming ? 'bg-tertiary/5 border border-tertiary/20' : 'hover:bg-surface-container-high'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`material-symbols-outlined text-[18px] flex-shrink-0 ${isUpcoming ? 'text-tertiary' : 'text-on-surface-variant'}`}>
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
                    <button
                      onClick={() => handleDeleteSubscription(sub.id)}
                      className="text-outline hover:text-error transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
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
