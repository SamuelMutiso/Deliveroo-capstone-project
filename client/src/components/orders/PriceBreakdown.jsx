import { distance, duration, money } from '@/utils/formatters'

export default function PriceBreakdown({ quote, route, compact = false }) {
  if (!quote) return null

  return (
    <div
      className={[
        'rounded-2xl bg-slate-950 text-white',
        compact ? 'p-6' : 'p-6 sm:p-8',
      ].join(' ')}
    >
      <div className="flex items-baseline justify-between gap-3.5">
        <p className="font-body text-xs uppercase tracking-[0.14em] text-slate-400">Your quote</p>
        {route && (
          <p className="font-mono text-xs text-slate-400">
            {distance(route.distance_km)} · {duration(route.duration_min)}
          </p>
        )}
      </div>

      <p className="mt-1.5 font-display text-4xl font-semibold tracking-tight">
        {money(quote.total)}
      </p>

      <dl className="mt-6 flex flex-col gap-2.5 border-t border-white/10 pt-3.5">
        {quote.lines
          .filter((line) => line.amount !== 0)
          .map((line) => (
            <div key={line.label} className="flex items-baseline justify-between gap-3.5">
              <dt className="font-body text-sm text-slate-300">{line.label}</dt>
              <dd className="font-mono text-sm text-white">{money(line.amount)}</dd>
            </div>
          ))}
      </dl>

      <p className="mt-3.5 font-body text-xs text-slate-400">
        Priced on {quote.category_label} handling over {distance(quote.distance_km)}.
      </p>
    </div>
  )
}