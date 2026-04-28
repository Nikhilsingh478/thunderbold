import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, ShoppingBag, TrendingUp, Users } from 'lucide-react';
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
        const r = await fetch('/api/admin/analytics', {
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
  }, [user]);

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
          label="Total Orders"
          value={overview.totalOrders}
          icon={ShoppingBag}
          format="number"
          index={1}
        />
        <StatsCard
          label="Avg Order Value"
          value={overview.averageOrderValue}
          icon={TrendingUp}
          format="currency"
          index={2}
        />
        <StatsCard
          label="Total Users"
          value={overview.totalUsers}
          icon={Users}
          format="number"
          index={3}
        />
      </div>

      {/* Charts */}
      <RevenueChart data={revenueSeries} />
      <OrdersChart data={ordersSeries} />

      {/* Top products + stock alerts side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TopProducts data={topProducts} />
        <StockAlerts data={stockAlerts} />
      </div>

      <RecentOrders data={recentOrders} />
    </motion.div>
  );
}
