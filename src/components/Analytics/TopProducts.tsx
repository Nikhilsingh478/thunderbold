import ChartCard from './ChartCard';
import type { TopProduct } from './types';

interface TopProductsProps {
  data: TopProduct[];
}

export default function TopProducts({ data }: TopProductsProps) {
  if (!data.length) {
    return (
      <ChartCard title="Top Products" subtitle="Best sellers">
        <p className="font-condensed text-xs uppercase tracking-[0.18em] text-sv-mid py-8 text-center">
          No sales yet
        </p>
      </ChartCard>
    );
  }

  const max = Math.max(...data.map((p) => p.totalSold), 1);

  return (
    <ChartCard title="Top Products" subtitle="Best sellers · last 30 days">
      <ul className="space-y-3">
        {data.map((p, i) => {
          const pct = (p.totalSold / max) * 100;
          return (
            <li
              key={p.productId ?? `${p.name}-${i}`}
              className="flex items-center gap-3 group"
            >
              <span className="font-condensed text-[10px] tracking-[0.18em] text-sv-mid w-4 shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white/[0.03]">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full bg-white/[0.03]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-tb-white" title={p.name}>
                  {p.name}
                </p>
                <div className="mt-1 h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brass/70 to-brass transition-[width] duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className="font-display text-sm sm:text-base tracking-[0.04em] text-tb-white tabular-nums shrink-0">
                {p.totalSold}
              </span>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}
