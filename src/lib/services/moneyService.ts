import { supabase } from '../supabase';
import dayjs from 'dayjs';
import {
  DEFAULT_CURRENCY,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  calculateBudgetUsage,
  getUpcomingBills,
  getActiveSubscriptions,
  type MoneyCategory,
  type MoneyTransaction,
  type Budget,
  type SavingsGoal,
  type Debt,
  type Subscription,
} from '../money';

// ================================================================
// Categories
// ================================================================

export async function getMoneyCategories(userId: string): Promise<MoneyCategory[]> {
  const { data: existing, error } = await supabase
    .from('money_categories' as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  if (existing && existing.length > 0) {
    return existing.map(mapCategory);
  }

  // Lazily seed default categories on first use.
  const seedRows = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
      user_id: userId,
      name,
      type: 'expense' as const,
    })),
    ...DEFAULT_INCOME_CATEGORIES.map((name) => ({
      user_id: userId,
      name,
      type: 'income' as const,
    })),
  ];

  const { data: seeded, error: seedError } = await supabase
    .from('money_categories' as any)
    .insert(seedRows)
    .select();

  if (seedError) throw new Error(seedError.message);
  return (seeded || []).map(mapCategory);
}

export async function createMoneyCategory(
  userId: string,
  data: { name: string; type: 'income' | 'expense'; color?: string; icon?: string }
): Promise<MoneyCategory> {
  const { data: category, error } = await supabase
    .from('money_categories' as any)
    .insert({
      user_id: userId,
      name: data.name,
      type: data.type,
      color: data.color || null,
      icon: data.icon || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapCategory(category);
}

// ================================================================
// Transactions
// ================================================================

export interface TransactionFilters {
  month?: number;
  year?: number;
  type?: string;
  categoryId?: string;
  paymentMethod?: string;
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getMoneyTransactions(
  userId: string,
  filters?: TransactionFilters
): Promise<MoneyTransaction[]> {
  let query = supabase
    .from('money_transactions' as any)
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters?.paymentMethod) query = query.eq('payment_method', filters.paymentMethod);
  if (filters?.currency) query = query.eq('currency', filters.currency);

  if (filters?.month && filters?.year) {
    const start = dayjs(`${filters.year}-${filters.month}-01`).startOf('month').format('YYYY-MM-DD');
    const end = dayjs(`${filters.year}-${filters.month}-01`).endOf('month').format('YYYY-MM-DD');
    query = query.gte('date', start).lte('date', end);
  } else {
    if (filters?.dateFrom) query = query.gte('date', filters.dateFrom);
    if (filters?.dateTo) query = query.lte('date', filters.dateTo);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(mapTransaction);
}

export async function createMoneyTransaction(
  userId: string,
  data: {
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    currency?: string;
    categoryId?: string | null;
    title: string;
    description?: string;
    date: string;
    paymentMethod?: string;
    lifeArea?: string | null;
    isRecurring?: boolean;
    recurringRule?: Record<string, unknown> | null;
  }
): Promise<MoneyTransaction> {
  const { data: transaction, error } = await supabase
    .from('money_transactions' as any)
    .insert({
      user_id: userId,
      type: data.type,
      amount: data.amount,
      currency: data.currency || DEFAULT_CURRENCY,
      category_id: data.categoryId || null,
      title: data.title,
      description: data.description || null,
      date: data.date,
      payment_method: data.paymentMethod || null,
      life_area: data.lifeArea ?? 'money',
      is_recurring: data.isRecurring ?? false,
      recurring_rule: data.recurringRule || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapTransaction(transaction);
}

export async function updateMoneyTransaction(
  transactionId: string,
  userId: string,
  data: {
    type?: 'income' | 'expense' | 'transfer';
    amount?: number;
    currency?: string;
    categoryId?: string | null;
    title?: string;
    description?: string;
    date?: string;
    paymentMethod?: string;
    lifeArea?: string | null;
    isRecurring?: boolean;
    recurringRule?: Record<string, unknown> | null;
  }
): Promise<MoneyTransaction> {
  const updateData: Record<string, unknown> = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.date !== undefined) updateData.date = data.date;
  if (data.paymentMethod !== undefined) updateData.payment_method = data.paymentMethod;
  if (data.lifeArea !== undefined) updateData.life_area = data.lifeArea;
  if (data.isRecurring !== undefined) updateData.is_recurring = data.isRecurring;
  if (data.recurringRule !== undefined) updateData.recurring_rule = data.recurringRule;
  updateData.updated_at = new Date().toISOString();

  const { data: transaction, error } = await supabase
    .from('money_transactions' as any)
    .update(updateData)
    .eq('id', transactionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapTransaction(transaction);
}

export async function deleteMoneyTransaction(transactionId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('money_transactions' as any)
    .delete()
    .eq('id', transactionId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// ================================================================
// Budgets
// ================================================================

export async function getMoneyBudgets(
  userId: string,
  month?: number,
  year?: number
): Promise<Budget[]> {
  let query = supabase.from('money_budgets' as any).select('*').eq('user_id', userId);

  if (month) query = query.eq('month', month);
  if (year) query = query.eq('year', year);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const budgets = (data || []).map(mapBudget);
  if (budgets.length === 0) return budgets;

  // Compute spentAmount per budget from matching transactions.
  const transactions = await getMoneyTransactions(userId, { type: 'expense' });
  return budgets.map((budget) => {
    const { spentAmount } = calculateBudgetUsage(budget, transactions);
    return { ...budget, spentAmount };
  });
}

export async function createMoneyBudget(
  userId: string,
  data: { month: number; year: number; categoryId?: string | null; amount: number; currency?: string }
): Promise<Budget> {
  const { data: budget, error } = await supabase
    .from('money_budgets' as any)
    .insert({
      user_id: userId,
      month: data.month,
      year: data.year,
      category_id: data.categoryId || null,
      amount: data.amount,
      currency: data.currency || DEFAULT_CURRENCY,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapBudget(budget);
}

export async function updateMoneyBudget(
  budgetId: string,
  userId: string,
  data: { month?: number; year?: number; categoryId?: string | null; amount?: number; currency?: string }
): Promise<Budget> {
  const updateData: Record<string, unknown> = {};
  if (data.month !== undefined) updateData.month = data.month;
  if (data.year !== undefined) updateData.year = data.year;
  if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.currency !== undefined) updateData.currency = data.currency;
  updateData.updated_at = new Date().toISOString();

  const { data: budget, error } = await supabase
    .from('money_budgets' as any)
    .update(updateData)
    .eq('id', budgetId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapBudget(budget);
}

export async function deleteMoneyBudget(budgetId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('money_budgets' as any)
    .delete()
    .eq('id', budgetId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// ================================================================
// Savings Goals
// ================================================================

export async function getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
  const { data, error } = await supabase
    .from('savings_goals' as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapSavingsGoal);
}

export async function createSavingsGoal(
  userId: string,
  data: {
    title: string;
    targetAmount?: number;
    currentAmount?: number;
    currency?: string;
    targetDate?: string;
  }
): Promise<SavingsGoal> {
  const { data: goal, error } = await supabase
    .from('savings_goals' as any)
    .insert({
      user_id: userId,
      title: data.title,
      target_amount: data.targetAmount ?? null,
      current_amount: data.currentAmount ?? 0,
      currency: data.currency || DEFAULT_CURRENCY,
      target_date: data.targetDate || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSavingsGoal(goal);
}

export async function updateSavingsGoal(
  goalId: string,
  userId: string,
  data: {
    title?: string;
    targetAmount?: number;
    currentAmount?: number;
    currency?: string;
    targetDate?: string;
    status?: 'active' | 'completed' | 'paused';
  }
): Promise<SavingsGoal> {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.targetAmount !== undefined) updateData.target_amount = data.targetAmount;
  if (data.currentAmount !== undefined) updateData.current_amount = data.currentAmount;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.targetDate !== undefined) updateData.target_date = data.targetDate;
  if (data.status !== undefined) updateData.status = data.status;
  updateData.updated_at = new Date().toISOString();

  const { data: goal, error } = await supabase
    .from('savings_goals' as any)
    .update(updateData)
    .eq('id', goalId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSavingsGoal(goal);
}

export async function incrementSavingsGoal(
  goalId: string,
  userId: string,
  amount: number
): Promise<SavingsGoal> {
  const { data: goal, error } = await supabase.rpc('increment_savings_goal', {
    p_id: goalId,
    p_user_id: userId,
    p_amount: amount,
  } as any);

  if (error) throw new Error(error.message);
  if (!goal) throw new Error('Savings goal not found');
  return mapSavingsGoal(goal as any);
}

export async function deleteSavingsGoal(goalId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('savings_goals' as any)
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// ================================================================
// Debts
// ================================================================

export async function getDebts(userId: string): Promise<Debt[]> {
  const { data, error } = await supabase
    .from('debts' as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapDebt);
}

export async function createDebt(
  userId: string,
  data: {
    title: string;
    totalAmount?: number;
    remainingAmount?: number;
    currency?: string;
    monthlyPayment?: number;
    dueDate?: string;
  }
): Promise<Debt> {
  const { data: debt, error } = await supabase
    .from('debts' as any)
    .insert({
      user_id: userId,
      title: data.title,
      total_amount: data.totalAmount ?? null,
      remaining_amount: data.remainingAmount ?? data.totalAmount ?? null,
      currency: data.currency || DEFAULT_CURRENCY,
      monthly_payment: data.monthlyPayment ?? null,
      due_date: data.dueDate || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapDebt(debt);
}

export async function updateDebt(
  debtId: string,
  userId: string,
  data: {
    title?: string;
    totalAmount?: number;
    remainingAmount?: number;
    currency?: string;
    monthlyPayment?: number;
    dueDate?: string;
    status?: 'active' | 'paid' | 'paused';
  }
): Promise<Debt> {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.totalAmount !== undefined) updateData.total_amount = data.totalAmount;
  if (data.remainingAmount !== undefined) updateData.remaining_amount = data.remainingAmount;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.monthlyPayment !== undefined) updateData.monthly_payment = data.monthlyPayment;
  if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
  if (data.status !== undefined) updateData.status = data.status;
  updateData.updated_at = new Date().toISOString();

  const { data: debt, error } = await supabase
    .from('debts' as any)
    .update(updateData)
    .eq('id', debtId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapDebt(debt);
}

export async function decrementDebtRemaining(
  debtId: string,
  userId: string,
  amount: number
): Promise<Debt> {
  const { data: debt, error } = await supabase.rpc('decrement_debt_remaining', {
    p_id: debtId,
    p_user_id: userId,
    p_amount: amount,
  } as any);

  if (error) throw new Error(error.message);
  if (!debt) throw new Error('Debt not found');
  return mapDebt(debt as any);
}

export async function deleteDebt(debtId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('debts' as any)
    .delete()
    .eq('id', debtId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// ================================================================
// Subscriptions
// ================================================================

export async function getSubscriptions(userId: string): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscriptions' as any)
    .select('*')
    .eq('user_id', userId)
    .order('next_billing_date', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapSubscription);
}

export async function createSubscription(
  userId: string,
  data: {
    title: string;
    amount?: number;
    currency?: string;
    billingCycle?: 'monthly' | 'yearly' | 'weekly' | 'custom';
    nextBillingDate?: string;
    categoryId?: string | null;
    isActive?: boolean;
  }
): Promise<Subscription> {
  const { data: subscription, error } = await supabase
    .from('subscriptions' as any)
    .insert({
      user_id: userId,
      title: data.title,
      amount: data.amount ?? null,
      currency: data.currency || DEFAULT_CURRENCY,
      billing_cycle: data.billingCycle || null,
      next_billing_date: data.nextBillingDate || null,
      category_id: data.categoryId || null,
      is_active: data.isActive ?? true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSubscription(subscription);
}

export async function updateSubscription(
  subscriptionId: string,
  userId: string,
  data: {
    title?: string;
    amount?: number;
    currency?: string;
    billingCycle?: 'monthly' | 'yearly' | 'weekly' | 'custom';
    nextBillingDate?: string;
    categoryId?: string | null;
    isActive?: boolean;
  }
): Promise<Subscription> {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.billingCycle !== undefined) updateData.billing_cycle = data.billingCycle;
  if (data.nextBillingDate !== undefined) updateData.next_billing_date = data.nextBillingDate;
  if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;
  updateData.updated_at = new Date().toISOString();

  const { data: subscription, error } = await supabase
    .from('subscriptions' as any)
    .update(updateData)
    .eq('id', subscriptionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSubscription(subscription);
}

export async function deleteSubscription(subscriptionId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('subscriptions' as any)
    .delete()
    .eq('id', subscriptionId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// ================================================================
// Summary (dashboard / life-areas / weekly-review consumption)
// ================================================================

export async function getMoneySummary(userId: string) {
  const now = dayjs();
  const month = now.month() + 1;
  const year = now.year();

  const [transactions, budgets, savingsGoals, debts, subscriptions] = await Promise.all([
    getMoneyTransactions(userId, { month, year }),
    getMoneyBudgets(userId, month, year),
    getSavingsGoals(userId),
    getDebts(userId),
    getSubscriptions(userId),
  ]);

  const monthlyIncome = calculateMonthlyIncome(transactions, month, year);
  const monthlyExpenses = calculateMonthlyExpenses(transactions, month, year);
  const netBalance = monthlyIncome - monthlyExpenses;

  // Savings this month = sum of positive deltas isn't tracked historically,
  // so approximate via transactions tagged as savings transfers isn't modeled;
  // use sum of current_amount changes isn't available either — fall back to
  // total currentAmount across active goals contributed conceptually this
  // month is not derivable without history, so report total active savings.
  const savingsThisMonth = savingsGoals
    .filter((g) => g.status === 'active')
    .reduce((sum, g) => sum + g.currentAmount, 0);

  const overallBudget = budgets.find((b) => b.categoryId == null);
  const totalBudgetAmount = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpentAmount = budgets.reduce((sum, b) => sum + (b.spentAmount || 0), 0);
  const budgetUsedPercentage = overallBudget
    ? calculateBudgetUsage(overallBudget, transactions).percentage
    : totalBudgetAmount > 0
      ? Math.round((totalSpentAmount / totalBudgetAmount) * 100)
      : 0;

  const debtRemaining = debts
    .filter((d) => d.status === 'active')
    .reduce((sum, d) => sum + (d.remainingAmount || 0), 0);

  const upcomingBillsCount = getUpcomingBills(subscriptions, 7).length;
  const activeSubscriptionsCount = getActiveSubscriptions(subscriptions).length;

  return {
    monthlyIncome,
    monthlyExpenses,
    netBalance,
    savingsThisMonth,
    budgetUsedPercentage,
    debtRemaining,
    upcomingBillsCount,
    activeSubscriptionsCount,
    currency: DEFAULT_CURRENCY,
  };
}

// ================================================================
// Mappers — snake_case DB rows -> camelCase domain types
// ================================================================

function mapCategory(c: any): MoneyCategory {
  return {
    id: c.id,
    userId: c.user_id,
    name: c.name,
    type: c.type,
    color: c.color ?? null,
    icon: c.icon ?? null,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

function mapTransaction(t: any): MoneyTransaction {
  return {
    id: t.id,
    userId: t.user_id,
    type: t.type,
    amount: Number(t.amount),
    currency: t.currency ?? DEFAULT_CURRENCY,
    categoryId: t.category_id ?? null,
    title: t.title,
    description: t.description ?? null,
    date: t.date,
    paymentMethod: t.payment_method ?? null,
    lifeArea: t.life_area ?? null,
    isRecurring: t.is_recurring ?? false,
    recurringRule: t.recurring_rule ?? null,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

function mapBudget(b: any): Budget {
  return {
    id: b.id,
    userId: b.user_id,
    month: b.month,
    year: b.year,
    categoryId: b.category_id ?? null,
    amount: Number(b.amount),
    currency: b.currency ?? DEFAULT_CURRENCY,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
}

function mapSavingsGoal(g: any): SavingsGoal {
  return {
    id: g.id,
    userId: g.user_id,
    title: g.title,
    targetAmount: g.target_amount != null ? Number(g.target_amount) : null,
    currentAmount: Number(g.current_amount ?? 0),
    currency: g.currency ?? DEFAULT_CURRENCY,
    targetDate: g.target_date ?? null,
    status: g.status ?? 'active',
    createdAt: g.created_at,
    updatedAt: g.updated_at,
  };
}

function mapDebt(d: any): Debt {
  return {
    id: d.id,
    userId: d.user_id,
    title: d.title,
    totalAmount: d.total_amount != null ? Number(d.total_amount) : null,
    remainingAmount: d.remaining_amount != null ? Number(d.remaining_amount) : null,
    currency: d.currency ?? DEFAULT_CURRENCY,
    monthlyPayment: d.monthly_payment != null ? Number(d.monthly_payment) : null,
    dueDate: d.due_date ?? null,
    status: d.status ?? 'active',
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
}

function mapSubscription(s: any): Subscription {
  return {
    id: s.id,
    userId: s.user_id,
    title: s.title,
    amount: s.amount != null ? Number(s.amount) : null,
    currency: s.currency ?? DEFAULT_CURRENCY,
    billingCycle: s.billing_cycle ?? null,
    nextBillingDate: s.next_billing_date ?? null,
    categoryId: s.category_id ?? null,
    isActive: s.is_active ?? true,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}
