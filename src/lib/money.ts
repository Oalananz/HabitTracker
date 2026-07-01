/**
 * Money Tracker — shared types, constants, and pure calculation helpers.
 * No DB access here; see src/lib/services/moneyService.ts for CRUD.
 */

export const DEFAULT_CURRENCY = 'JOD';

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Rent',
  'Bills',
  'Phone / Internet',
  'Shopping',
  'Family',
  'Health',
  'Education',
  'Entertainment',
  'Business',
  'Other',
];

export const DEFAULT_INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Gift', 'Other'];

export type MoneyTransactionType = 'income' | 'expense' | 'transfer';
export type MoneyCategoryType = 'income' | 'expense';
export type SavingsGoalStatus = 'active' | 'completed' | 'paused';
export type DebtStatus = 'active' | 'paid' | 'paused';
export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | 'custom';

export interface MoneyCategory {
  id: string;
  userId: string;
  name: string;
  type: MoneyCategoryType;
  color: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MoneyTransaction {
  id: string;
  userId: string;
  type: MoneyTransactionType;
  amount: number;
  currency: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  date: string;
  paymentMethod: string | null;
  lifeArea: string | null;
  isRecurring: boolean;
  recurringRule: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  month: number;
  year: number;
  categoryId: string | null;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  /** Computed, not stored — sum of matching expense transactions. */
  spentAmount?: number;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number | null;
  currentAmount: number;
  currency: string;
  targetDate: string | null;
  status: SavingsGoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: string;
  userId: string;
  title: string;
  totalAmount: number | null;
  remainingAmount: number | null;
  currency: string;
  monthlyPayment: number | null;
  dueDate: string | null;
  status: DebtStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  title: string;
  amount: number | null;
  currency: string;
  billingCycle: BillingCycle | null;
  nextBillingDate: string | null;
  categoryId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------------
// Pure calculation helpers
// ----------------------------------------------------------------

function isInMonth(dateStr: string, month: number, year: number): boolean {
  const d = new Date(dateStr);
  return d.getMonth() + 1 === month && d.getFullYear() === year;
}

export function calculateMonthlyIncome(
  transactions: MoneyTransaction[],
  month: number,
  year: number
): number {
  return transactions
    .filter((t) => t.type === 'income' && isInMonth(t.date, month, year))
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateMonthlyExpenses(
  transactions: MoneyTransaction[],
  month: number,
  year: number
): number {
  return transactions
    .filter((t) => t.type === 'expense' && isInMonth(t.date, month, year))
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateNetBalance(
  transactions: MoneyTransaction[],
  month: number,
  year: number
): number {
  return (
    calculateMonthlyIncome(transactions, month, year) -
    calculateMonthlyExpenses(transactions, month, year)
  );
}

export function calculateBudgetUsage(
  budget: Budget,
  transactions: MoneyTransaction[]
): { spentAmount: number; percentage: number } {
  const spentAmount = transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        isInMonth(t.date, budget.month, budget.year) &&
        (budget.categoryId == null || t.categoryId === budget.categoryId)
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const percentage = budget.amount > 0 ? Math.round((spentAmount / budget.amount) * 100) : 0;

  return { spentAmount, percentage };
}

export function calculateSavingsProgress(goal: SavingsGoal): number {
  if (!goal.targetAmount || goal.targetAmount <= 0) return 0;
  return Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
}

export function calculateDebtProgress(debt: Debt): number {
  if (!debt.totalAmount || debt.totalAmount <= 0) return 0;
  const remaining = debt.remainingAmount ?? debt.totalAmount;
  const paidOff = debt.totalAmount - remaining;
  return Math.min(Math.max(Math.round((paidOff / debt.totalAmount) * 100), 0), 100);
}

export function getUpcomingBills(
  subscriptions: Subscription[],
  withinDays: number = 7
): Subscription[] {
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(now.getDate() + withinDays);

  return subscriptions.filter((s) => {
    if (!s.isActive || !s.nextBillingDate) return false;
    const billDate = new Date(s.nextBillingDate);
    return billDate >= now && billDate <= cutoff;
  });
}

export function getActiveSubscriptions(subscriptions: Subscription[]): Subscription[] {
  return subscriptions.filter((s) => s.isActive);
}

export function getExpenseByCategory(
  transactions: MoneyTransaction[],
  categories: MoneyCategory[]
): { categoryName: string; total: number; percentage: number }[] {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  const categoryMap = new Map<string, string>(categories.map((c) => [c.id, c.name]));
  const totalsByCategory = new Map<string, number>();

  for (const t of expenses) {
    const name = (t.categoryId && categoryMap.get(t.categoryId)) || 'Uncategorized';
    totalsByCategory.set(name, (totalsByCategory.get(name) || 0) + t.amount);
  }

  return Array.from(totalsByCategory.entries())
    .map(([categoryName, total]) => ({
      categoryName,
      total,
      percentage: totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}
