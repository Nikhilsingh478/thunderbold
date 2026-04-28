import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import ChartCard from './ChartCard';
import type { RevenuePoint } from './types';

interface RevenueChartProps {
  data: RevenuePoint[];
}

const inrCompact = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const inrFull = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function fmtDay(d: string) {
  // d is YYYY-MM-DD
  const date = new Date(d + 'T00:00:00Z');
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const total = useMemo(() => data.reduce((s, p) => s + p.revenue, 0), [data]);

  return (
    <ChartCard
      title="Revenue"
      subtitle="Last 30 days"
      right={
        <div className="text-right">
          <p className="font-condensed text-[10px] uppercase tracking-[0.18em] text-sv-mid">Total</p>
          <p className="font-display text-base sm:text-lg tracking-[0.04em] text-brass tabular-nums">
            {inrFull.format(Math.round(total))}
          </p>
        </div>
      }
    >
      <div className="h-56 sm:h-64 md:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4a32c" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#d4a32c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={fmtDay}
              tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(v) => '₹' + inrCompact.format(v)}
              tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              cursor={{ stroke: 'rgba(212,163,44,0.35)', strokeWidth: 1 }}
              contentStyle={{
                background: 'rgba(10,10,10,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                fontSize: 12,
                color: '#fff',
              }}
              labelFormatter={(d) => fmtDay(String(d))}
              formatter={(v: number) => [inrFull.format(Math.round(v)), 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#d4a32c"
              strokeWidth={2}
              fill="url(#revFill)"
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
