'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import SectionHeader from '@/components/ui/SectionHeader';

interface ExpenseCategorySlice {
  categoryName: string;
  total: number;
  percentage: number;
}

interface ExpenseBreakdownChartProps {
  data: ExpenseCategorySlice[];
}

const SLICE_COLORS = ['#6cdd81', '#5b9dff', '#fabc45', '#b18cff', '#ff9ec4', '#5fd6c9', '#ffb4ab', '#889486'];

export default function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  const hasData = data.length > 0;

  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
      <SectionHeader title="Expense breakdown" rightContent="This month" />
      {!hasData ? (
        <div className="h-[120px] flex items-center justify-center text-xs text-on-surface-variant/50">
          No expenses recorded this month.
        </div>
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="99%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="categoryName"
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                stroke="#10141a"
                strokeWidth={1}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.categoryName} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1c2026',
                  border: '1px solid rgba(62,74,62,0.3)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'Space Grotesk',
                  color: '#dfe2eb',
                }}
                formatter={(value, name) => [Number(value ?? 0).toFixed(2), name]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span style={{ color: '#bdcaba', fontSize: 11, fontFamily: 'Space Grotesk' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
