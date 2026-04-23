'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface WeeklyTrend {
  week: string;
  rate: number;
  completed: number;
  total: number;
}

interface ChartWidgetsProps {
  weeklyTrend: WeeklyTrend[];
}

export default function ChartWidgets({ weeklyTrend }: ChartWidgetsProps) {
  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
          <span className="text-primary">&gt;</span> WEEKLY_PERFORMANCE
        </h3>
        <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">12 WEEKS</span>
      </div>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="99%" height="100%">
          <AreaChart data={weeklyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6cdd81" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6cdd81" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: '#889486', fontFamily: 'Space Grotesk' }}
              tickLine={false}
              axisLine={{ stroke: '#3e4a3e', strokeWidth: 0.5 }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#889486', fontFamily: 'Space Grotesk' }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1c2026',
                border: '1px solid rgba(62,74,62,0.3)',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'Space Grotesk',
                color: '#dfe2eb',
              }}
              formatter={(value: any) => [`${value}%`, 'Rate']}
              labelStyle={{ color: '#bdcaba' }}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#6cdd81"
              strokeWidth={2}
              fill="url(#colorRate)"
              dot={{ fill: '#6cdd81', strokeWidth: 0, r: 3 }}
              activeDot={{ fill: '#6cdd81', strokeWidth: 2, stroke: '#10141a', r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
