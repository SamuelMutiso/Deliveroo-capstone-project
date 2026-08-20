import { STATUS_META } from '@/utils/constants'
import { clockTime, relativeTime, shortDate } from '@/utils/formatters'

export default function OrderTimeline({ events = [] }) {
  if (!events.length) {
    return <p className="font-body text-sm text-slate-500">No tracking updates yet.</p>
  }

  const ordered = [...events].reverse()

  return (
    <ol className="flex flex-col">
      {ordered.map((event, index) => {
        const meta = STATUS_META[event.status] || { label: event.status, dot: 'bg-slate-400' }
        const isLatest = index === 0

        return (
          <li key={event.id} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span
                className={[
                  'mt-0.5 h-3 w-3 shrink-0 rounded-full ring-4',
                  meta.dot,
                  isLatest ? 'ring-brand-100' : 'ring-white',
                ].join(' ')}
                aria-hidden="true"
              />
              {index < ordered.length - 1 && <span className="w-px flex-1 bg-slate-100" aria-hidden="true" />}
            </div>

            <div className={index < ordered.length - 1 ? 'pb-6' : ''}>
              <div className="flex flex-wrap items-baseline gap-2.5">
                <p className="font-display text-base font-semibold text-slate-900">{meta.label}</p>
                <p className="font-mono text-xs text-slate-400">
                  {shortDate(event.created_at)} · {clockTime(event.created_at)}
                </p>
              </div>
              {event.note && (
                <p className="mt-0.5 font-body text-sm text-slate-600">{event.note}</p>
              )}
              <p className="mt-0.5 font-body text-xs text-slate-400">
                {event.actor ? `${event.actor.name} · ${event.actor.role}` : 'System'} ·{' '}
                {relativeTime(event.created_at)}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}