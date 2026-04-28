import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Wrapper used by every analytics panel — keeps spacing & headings consistent. */
export default function ChartCard({ title, subtitle, right, children, className = '' }: ChartCardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 md:p-6 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base sm:text-lg tracking-[0.06em] text-tb-white uppercase">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 font-condensed text-[11px] uppercase tracking-[0.18em] text-sv-mid">
              {subtitle}
            </p>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {children}
    </div>
  );
}
