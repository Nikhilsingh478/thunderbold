import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, IndianRupee, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StatsCard from './StatsCard';
import RevenueChart from './RevenueChart';
import OrdersChart from './OrdersChart';
import TopProducts from './TopProducts';
import StockAlerts from './StockAlerts';
import RecentOrders from './RecentOrders';
import type { AnalyticsPayload } from './types';

/**
 * Read-only analytics dashboard.
 *
 * Single GET to /api/admin/analytics returns every aggregation in one
 * round trip — server runs them in parallel with Promise.all.
 */
export default function AnalyticsTab() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [range, setRange] = useState<'7d' | '30d' | 'month'>('month');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await user.getIdToken();
        const params = new URLSearchParams({ range });
        if (range === 'month' && selectedMonth) params.set('month', selectedMonth);
        const r = await fetch(`/api/admin/analytics?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) {
          let msg = `Request failed (${r.status})`;
          try {
            const j = await r.json();
            if (j?.error) msg = j.error;
          } catch {}
          throw new Error(msg);
        }
        const json = (await r.json()) as AnalyticsPayload;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError((e as Error).message || 'Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, range, selectedMonth]);

  useEffect(() => {
    if (range === 'month' && !selectedMonth) {
      const now = new Date();
      setSelectedMonth(`${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`);
    }
  }, [range, selectedMonth]);

  const monthLabel = useMemo(() => {
    if (!selectedMonth) return 'Current month';
    const [year, month] = selectedMonth.split('-');
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }, [selectedMonth]);

  const shiftMonth = (delta: number) => {
    const base = selectedMonth || `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, '0')}`;
    const [year, month] = base.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1 + delta, 1));
    setSelectedMonth(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-white/10 border-t-white/60" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="font-condensed text-sm uppercase tracking-[0.18em] text-red-300">
          {error || 'No analytics data available'}
        </p>
      </div>
    );
  }

  const { overview, revenueSeries, ordersSeries, topProducts, stockAlerts, recentOrders } = data;

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5 sm:space-y-6"
    >
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          label="Total Revenue"
          value={overview.totalRevenue}
          icon={IndianRupee}
          format="currency"
          index={0}
        />
        <StatsCard
          label="Net Revenue"
          value={overview.netRevenue}
          icon={IndianRupee}
          format="currency"
          index={1}
        />
        <StatsCard
          label="Total Orders"
          value={overview.totalOrders}
          icon={ShoppingBag}
          format="number"
          index={2}
        />
        <StatsCard
          label="Avg Order Value"
          value={overview.averageOrderValue}
          icon={TrendingUp}
          format="currency"
          index={3}
        />
      </div>
      <div className="flex gap-2">
        {(['7d', '30d', 'month'] as const).map((item) => (
          <button
            key={item}
            onClick={() => setRange(item)}
            className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] transition ${
              range === item ? 'border-brass bg-brass/10 text-brass' : 'border-white/10 text-sv-mid'
            }`}
          >
            {item === '7d' ? 'Last 7 days' : item === '30d' ? 'Last 30 days' : 'This month'}
          </button>
        ))}
      </div>
      {range === 'month' && (
        <div className="flex items-center justify-between rounded-full border border-white/10 bg-white/[0.02] px-3 py-2">
          <button
            onClick={() => shiftMonth(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-sv-mid transition hover:border-brass hover:text-brass"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="font-condensed text-xs uppercase tracking-[0.18em] text-brass">{monthLabel}</p>
          <button
            onClick={() => shiftMonth(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-sv-mid transition hover:border-brass hover:text-brass"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Charts */}
      <RevenueChart data={revenueSeries} range={range} />
      <OrdersChart data={ordersSeries} range={range} />

      {/* Top products + stock alerts side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TopProducts data={topProducts} />
        <StockAlerts data={stockAlerts} />
      </div>

      <RecentOrders data={recentOrders} />
    </motion.div>
  );
}
