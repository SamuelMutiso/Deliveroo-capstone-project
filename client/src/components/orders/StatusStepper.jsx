import { DELIVERY_STAGES, STATUS, STATUS_META } from '@/utils/constants'

export default function StatusStepper({ status }) {
  if (status === STATUS.CANCELLED) {
    return (
      <div className="rounded-2xl bg-red-100/60 px-6 py-3.5 ring-1 ring-inset ring-red-300/50">
        <p className="font-display text-base font-semibold text-red-700">Delivery cancelled</p>
        <p className="mt-0.5 font-body text-sm text-slate-600">
          {STATUS_META[STATUS.CANCELLED].blurb}
        </p>
      </div>
    )
  }

  const activeIndex = DELIVERY_STAGES.indexOf(status)

  return (
    <ol className="flex items-center gap-0.5" aria-label="Delivery progress">
      {DELIVERY_STAGES.map((stage, index) => {
        const done = index <= activeIndex
        const current = index === activeIndex
        return (
          <li key={stage} className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-0.5">
              <span
                className={[
                  'relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  'font-mono text-xs font-medium transition-colors',
                  done ? 'bg-brand-400 text-brand-950' : 'bg-slate-100 text-slate-400',
                ].join(' ')}
              >
                {done ? '✓' : index + 1}
                {current && (
                  <span className="absolute inset-0 animate-ring rounded-full bg-brand-500/40" aria-hidden="true" />
                )}
              </span>
              {index < DELIVERY_STAGES.length - 1 && (
                <span
                  className={`h-0.5 flex-1 rounded-full ${index < activeIndex ? 'bg-brand-500' : 'bg-slate-100'}`}
                  aria-hidden="true"
                />
              )}
            </div>
            <span
              className={[
                'font-body text-xs font-semibold uppercase tracking-wide',
                current ? 'text-slate-900' : done ? 'text-brand-700' : 'text-slate-400',
              ].join(' ')}
            >
              {STATUS_META[stage].label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}