export interface SafeMoneyAiInput {
  monthlyIncome: number;
  monthlyExpenses: number;
  netBalance: number;
  budgetUsedPercentage: number;
  expenseByCategory: { categoryName: string; total: number; percentage: number }[];
}

// Never send transaction titles/notes, account numbers, payment methods, or
// any other identifying detail to any AI provider — only aggregated,
// category-level totals. Nothing here is sent anywhere yet (no AI feature
// is wired up for Money in this version); this exists so a future "AI Money
// Review" feature has a safe shape to build on.
export function sanitizeMoneyDataForAi(input: {
  monthlyIncome: number;
  monthlyExpenses: number;
  netBalance: number;
  budgetUsedPercentage: number;
  expenseByCategory: { categoryName: string; total: number; percentage: number }[];
}): SafeMoneyAiInput {
  return {
    monthlyIncome: input.monthlyIncome,
    monthlyExpenses: input.monthlyExpenses,
    netBalance: input.netBalance,
    budgetUsedPercentage: input.budgetUsedPercentage,
    expenseByCategory: input.expenseByCategory.map((c) => ({
      categoryName: c.categoryName,
      total: c.total,
      percentage: c.percentage,
    })),
  };
}
