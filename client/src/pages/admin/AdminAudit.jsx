import { useEffect, useMemo, useState } from 'react'
import EmptyState from '@/components/ui/EmptyState'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { PageContainer } from '@/components/layout/AppShell'
import { PageSpinner } from '@/components/ui/Spinner'
import { adminApi } from '@/api/adminApi'
import { fullDate } from '@/utils/formatters'

const ACTION_LABEL = {
  'payment.cash_confirmed': 'Cash confirmed',
  'payment.cash_rejected': 'Cash turned down',
  'rider.approved': 'Rider approved',
  'rider.rejected': 'Rider turned down',
  'order.assigned': 'Rider assigned',
  'order.status_changed': 'Status changed',
  'user.updated': 'Account changed',
}

const FILTERS = [{ value: '', label: 'Everything' }].concat(
  Object.entries(ACTION_LABEL).map(([value, label]) => ({ value, label })),
)

export default function AdminAudit() {
  const [events, setEvents] = useState([])
  const [action, setAction] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    let live = true
    setStatus('loading')

    adminApi
      .audit(action ? { action } : undefined)
      .then((data) => {
        if (live) {
          setEvents(data.items)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (live) {
          setError('Could not load the audit trail.')
          setStatus('failed')
        }
      })

    return () => {
      live = false
    }
  }, [action])

  const grouped = useMemo(() => {
    const days = new Map()
    for (const event of events) {
      const day = (event.created_at || '').slice(0, 10)
      if (!days.has(day)) days.set(day, [])
      days.get(day).push(event)
    }
    return [...days.entries()]
  }, [events])

  return (
    <PageContainer>
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">
            Audit trail
          </h1>
          <p className="mt-1 font-body text-base text-slate-500">
            Every action an administrator took, and who took it. Nothing here can be edited.
          </p>
        </div>

        <select
          value={action}
          onChange={(event) => setAction(event.target.value)}
          className="h-11 rounded-xl bg-white px-3.5 font-body text-sm text-slate-900 ring-1 ring-inset ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Filter by action"
        >
          {FILTERS.map((filter) => (
            <option key={filter.value || 'all'} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      {status === 'loading' && <PageSpinner label="Reading the trail" />}
      {status === 'failed' && <ErrorMessage message={error} />}

      {status === 'ready' && events.length === 0 && (
        <EmptyState
          title="Nothing recorded yet"
          message="Privileged actions appear here the moment an administrator takes one."
        />
      )}

      {status === 'ready' &&
        grouped.map(([day, entries]) => (
          <section key={day} className="mt-8">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              {fullDate(entries[0].created_at).split(',')[0]}
            </p>

            <ol className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-inset ring-slate-100">
              {entries.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-col gap-1 border-b border-slate-100 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-body text-sm font-semibold text-slate-900">
                      {ACTION_LABEL[event.action] || event.action}
                      <span className="ml-2 font-mono text-xs font-normal text-slate-400">
                        {event.subject_id}
                      </span>
                    </p>
                    <p className="mt-0.5 font-body text-sm text-slate-500">{event.summary}</p>
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <p className="font-body text-sm font-medium text-slate-700">
                      {event.actor_name}
                    </p>
                    <p className="font-body text-xs text-slate-400">
                      {fullDate(event.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
    </PageContainer>
  )
}
