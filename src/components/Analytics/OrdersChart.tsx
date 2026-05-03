import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import ChartCard from './ChartCard';
import type { OrdersPoint } from './types';

interface OrdersChartProps {
  data: OrdersPoint[];
  range: '7d' | '30d' | 'month';
}

function fmtLabel(value: string, range: '7d' | '30d' | 'month') {
  const [year, month, day] = value.split('-');
  if (range === 'month') {
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day || '1')));
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  }
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export default function OrdersChart({ data, range }: OrdersChartProps) {
  const total = useMemo(() => data.reduce((s, p) => s + p.count, 0), [data]);
  const monthly = range === 'month';

  return (
    <ChartCard
      title="Orders"
      subtitle={range === 'month' ? 'This month' : range === '30d' ? 'Last 30 days' : 'Last 7 days'}
      right={
        <div className="text-right">
          <p className="font-condensed text-[10px] uppercase tracking-[0.18em] text-sv-mid">Total</p>
          <p className="font-display text-base sm:text-lg tracking-[0.04em] text-brass tabular-nums">
            {total}
          </p>
        </div>
      }
    >
      <div className="h-56 sm:h-64 md:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {monthly ? (
            <LineChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="day"
                tickFormatter={(v) => fmtLabel(String(v), range)}
                tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                minTickGap={18}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={32}
                domain={['dataMin', 'dataMax']}
              />
              <Tooltip
                cursor={{ fill: 'rgba(212,163,44,0.08)' }}
                contentStyle={{
                  background: 'rgba(10,10,10,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  fontSize: 12,
                  color: '#fff',
                }}
                labelFormatter={(m) => fmtLabel(String(m), range)}
                formatter={(v: number) => [v, 'Orders']}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#d4a32c"
                strokeWidth={3}
                dot={{ r: 4, stroke: '#d4a32c', strokeWidth: 2, fill: '#111' }}
                activeDot={{ r: 6 }}
                animationDuration={500}
              />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="orderBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4a32c" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#d4a32c" stopOpacity={0.35} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="day"
                tickFormatter={(v) => fmtLabel(String(v), range)}
                tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                minTickGap={32}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                cursor={{ fill: 'rgba(212,163,44,0.08)' }}
                contentStyle={{
                  background: 'rgba(10,10,10,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  fontSize: 12,
                  color: '#fff',
                }}
                labelFormatter={(m) => fmtLabel(String(m), range)}
                formatter={(v: number) => [v, 'Orders']}
              />
              <Bar dataKey="count" fill="url(#orderBar)" radius={[4, 4, 0, 0]} animationDuration={500} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
