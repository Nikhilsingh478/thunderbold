import ChartCard from './ChartCard';
import type { RecentOrder } from './types';

interface RecentOrdersProps {
  data: RecentOrder[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  confirmed: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  shipped: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  delivered: 'bg-green-500/15 text-green-300 border-green-500/30',
  cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
};

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function fmtDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export default function RecentOrders({ data }: RecentOrdersProps) {
  if (!data.length) {
    return (
      <ChartCard title="Recent Orders" subtitle="Latest 5">
        <p className="font-condensed text-xs uppercase tracking-[0.18em] text-sv-mid py-8 text-center">
          No orders yet
        </p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Recent Orders" subtitle="Latest 5">
      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto -mx-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left font-condensed text-[10px] uppercase tracking-[0.18em] text-sv-mid">
              <th className="px-2 py-2 font-normal">Order</th>
              <th className="px-2 py-2 font-normal">Customer</th>
              <th className="px-2 py-2 font-normal">Items</th>
              <th className="px-2 py-2 font-normal">Status</th>
              <th className="px-2 py-2 font-normal text-right">Amount</th>
              <th className="px-2 py-2 font-normal text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((o) => (
              <tr key={o._id} className="text-tb-white/90">
                <td className="px-2 py-3 font-mono text-xs">#{o._id.slice(-8)}</td>
                <td className="px-2 py-3 truncate max-w-[180px]" title={o.customer}>
                  {o.customer}
                </td>
                <td className="px-2 py-3 text-sv-mid">{o.itemCount}</td>
                <td className="px-2 py-3">
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 font-condensed text-[10px] uppercase tracking-[0.18em] ${
                      STATUS_COLORS[o.status] ?? 'bg-gray-500/15 text-gray-300 border-gray-500/30'
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
                <td className="px-2 py-3 text-right tabular-nums">
                  {inr.format(Math.round(o.totalAmount))}
                </td>
                <td className="px-2 py-3 text-right text-sv-mid font-condensed text-xs">
                  {fmtDate(o.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <ul className="md:hidden space-y-3">
        {data.map((o) => (
          <li
            key={o._id}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-sv-mid">#{o._id.slice(-8)}</p>
                <p className="truncate text-sm text-tb-white" title={o.customer}>
                  {o.customer}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 font-condensed text-[10px] uppercase tracking-[0.18em] ${
                  STATUS_COLORS[o.status] ?? 'bg-gray-500/15 text-gray-300 border-gray-500/30'
                }`}
              >
                {o.status}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between font-condensed text-xs text-sv-mid">
              <span>{o.itemCount} items · {fmtDate(o.createdAt)}</span>
              <span className="text-tb-white tabular-nums">
                {inr.format(Math.round(o.totalAmount))}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
