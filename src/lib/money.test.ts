import { describe, expect, it } from 'vitest';
import {
  calculateSavingsProgress,
  calculateDebtProgress,
  calculateBudgetUsage,
  getExpenseByCategory,
  getUpcomingBills,
  type SavingsGoal,
  type Debt,
  type Budget,
  type MoneyTransaction,
  type MoneyCategory,
  type Subscription,
} from './money';

function transaction(overrides: Partial<MoneyTransaction>): MoneyTransaction {
  return {
    id: 't1',
    userId: 'u1',
    type: 'expense',
    amount: 0,
    currency: 'JOD',
    categoryId: null,
    title: '',
    description: null,
    date: '2026-06-15',
    paymentMethod: null,
    lifeArea: null,
    isRecurring: false,
    recurringRule: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('calculateSavingsProgress', () => {
  it('caps at 100% even if current exceeds target', () => {
    const goal = { targetAmount: 100, currentAmount: 150 } as SavingsGoal;
    expect(calculateSavingsProgress(goal)).toBe(100);
  });

  it('returns 0 when there is no target amount', () => {
    const goal = { targetAmount: 0, currentAmount: 50 } as SavingsGoal;
    expect(calculateSavingsProgress(goal)).toBe(0);
  });

  it('computes a normal percentage', () => {
    const goal = { targetAmount: 200, currentAmount: 50 } as SavingsGoal;
    expect(calculateSavingsProgress(goal)).toBe(25);
  });
});

describe('calculateDebtProgress', () => {
  it('is 0% paid off when nothing has been paid', () => {
    const debt = { totalAmount: 1000, remainingAmount: 1000 } as Debt;
    expect(calculateDebtProgress(debt)).toBe(0);
  });

  it('is 100% paid off when remaining is 0', () => {
    const debt = { totalAmount: 1000, remainingAmount: 0 } as Debt;
    expect(calculateDebtProgress(debt)).toBe(100);
  });

  it('falls back to totalAmount when remainingAmount is null', () => {
    const debt = { totalAmount: 500, remainingAmount: null } as Debt;
    expect(calculateDebtProgress(debt)).toBe(0);
  });
});

describe('calculateBudgetUsage', () => {
  it('only counts expenses in the matching month/category', () => {
    const budget = { month: 6, year: 2026, categoryId: 'food', amount: 200 } as Budget;
    const transactions = [
      transaction({ type: 'expense', amount: 50, categoryId: 'food', date: '2026-06-01' }),
      transaction({ type: 'expense', amount: 999, categoryId: 'rent', date: '2026-06-01' }), // wrong category
      transaction({ type: 'expense', amount: 999, categoryId: 'food', date: '2026-05-01' }), // wrong month
      transaction({ type: 'income', amount: 999, categoryId: 'food', date: '2026-06-01' }), // wrong type
    ];
    const { spentAmount, percentage } = calculateBudgetUsage(budget, transactions);
    expect(spentAmount).toBe(50);
    expect(percentage).toBe(25);
  });
});

describe('getExpenseByCategory', () => {
  it('groups expenses by category name and computes percentages', () => {
    const categories: MoneyCategory[] = [
      { id: 'c1', userId: 'u1', name: 'Food', type: 'expense', color: null, icon: null, createdAt: '', updatedAt: '' },
    ];
    const transactions = [
      transaction({ type: 'expense', amount: 30, categoryId: 'c1' }),
      transaction({ type: 'expense', amount: 70, categoryId: null }),
      transaction({ type: 'income', amount: 1000, categoryId: 'c1' }),
    ];
    const result = getExpenseByCategory(transactions, categories);
    expect(result).toEqual(
      expect.arrayContaining([
        { categoryName: 'Food', total: 30, percentage: 30 },
        { categoryName: 'Uncategorized', total: 70, percentage: 70 },
      ])
    );
  });
});

describe('getUpcomingBills', () => {
  it('excludes inactive subscriptions and ones without a next billing date', () => {
    const now = new Date();
    const soon = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const subs: Subscription[] = [
      { id: 's1', userId: 'u1', title: 'Active soon', amount: 10, currency: 'JOD', billingCycle: 'monthly', nextBillingDate: soon, categoryId: null, isActive: true, createdAt: '', updatedAt: '' },
      { id: 's2', userId: 'u1', title: 'Inactive', amount: 10, currency: 'JOD', billingCycle: 'monthly', nextBillingDate: soon, categoryId: null, isActive: false, createdAt: '', updatedAt: '' },
      { id: 's3', userId: 'u1', title: 'No date', amount: 10, currency: 'JOD', billingCycle: 'monthly', nextBillingDate: null, categoryId: null, isActive: true, createdAt: '', updatedAt: '' },
    ];
    const result = getUpcomingBills(subs, 7);
    expect(result.map((s) => s.id)).toEqual(['s1']);
  });
});
