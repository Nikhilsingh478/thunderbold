import { AlertTriangle, XCircle } from 'lucide-react';
import ChartCard from './ChartCard';
import type { StockAlerts as StockAlertsData, StockProduct } from './types';

interface StockAlertsProps {
  data: StockAlertsData;
}

function Row({ p, kind }: { p: StockProduct; kind: 'oos' | 'low' }) {
  return (
    <li className="flex items-center gap-3">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white/[0.03]">
        {p.image ? (
          <img src={p.image} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-white/[0.03]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-tb-white" title={p.name}>
          {p.name}
        </p>
        <p className="font-condensed text-[10px] uppercase tracking-[0.18em] text-sv-mid">
          {kind === 'oos' ? 'Out of stock' : `${p.stock} left`}
        </p>
      </div>
      {kind === 'oos' ? (
        <span className="shrink-0 rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-1 font-condensed text-[10px] uppercase tracking-[0.18em] text-red-300">
          OOS
        </span>
      ) : (
        <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-condensed text-[10px] uppercase tracking-[0.18em] text-amber-300">
          Low
        </span>
      )}
    </li>
  );
}

export default function StockAlerts({ data }: StockAlertsProps) {
  const empty = data.outOfStock.length === 0 && data.lowStock.length === 0;

  return (
    <ChartCard title="Stock Alerts" subtitle={`Threshold ≤ ${data.threshold}`}>
      {empty ? (
        <p className="font-condensed text-xs uppercase tracking-[0.18em] text-sv-mid py-8 text-center">
          All stock healthy
        </p>
      ) : (
        <div className="space-y-5">
          {data.outOfStock.length > 0 && (
            <section>
              <p className="mb-2 flex items-center gap-1.5 font-condensed text-[10px] uppercase tracking-[0.2em] text-red-300/80">
                <XCircle className="h-3.5 w-3.5" />
                Out of stock · {data.outOfStock.length}
              </p>
              <ul className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {data.outOfStock.slice(0, 8).map((p) => (
                  <Row key={p.productId} p={p} kind="oos" />
                ))}
              </ul>
            </section>
          )}
          {data.lowStock.length > 0 && (
            <section>
              <p className="mb-2 flex items-center gap-1.5 font-condensed text-[10px] uppercase tracking-[0.2em] text-amber-300/80">
                <AlertTriangle className="h-3.5 w-3.5" />
                Running low · {data.lowStock.length}
              </p>
              <ul className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {data.lowStock.slice(0, 8).map((p) => (
                  <Row key={p.productId} p={p} kind="low" />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </ChartCard>
  );
}
