import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

const FOLLOW_INTERVAL = 10000
const LIVE_STATUSES = ['picked_up', 'in_transit']

function minutesRemaining(order) {
  if (!order?.picked_up_at || !order?.duration_min) return null
  const startedAt = new Date(order.picked_up_at).getTime()
  if (Number.isNaN(startedAt)) return null
  const arrivesAt = startedAt + order.duration_min * 60000
  const left = Math.round((arrivesAt - Date.now()) / 60000)
  return left
}

export default function LiveTrackingBar({ order, onRefresh }) {
  const [following, setFollowing] = useState(false)
  const [refreshedAt, setRefreshedAt] = useState(() => Date.now())
  const [, forceTick] = useState(0)
  const savedRefresh = useRef(onRefresh)

  useEffect(() => {
    savedRefresh.current = onRefresh
  }, [onRefresh])

  const isLive = LIVE_STATUSES.includes(order?.status)

  useEffect(() => {
    if (!following || !isLive) return undefined

    const timer = window.setInterval(() => {
      savedRefresh.current()
      setRefreshedAt(Date.now())
    }, FOLLOW_INTERVAL)

    return () => window.clearInterval(timer)
  }, [following, isLive])

  useEffect(() => {
    const timer = window.setInterval(() => forceTick((value) => value + 1), 15000)
    return () => window.clearInterval(timer)
  }, [])

  if (!isLive) return null

  const left = minutesRemaining(order)
  const seconds = Math.round((Date.now() - refreshedAt) / 1000)
  const ago = seconds < 20 ? 'just now' : seconds < 90 ? 'a minute ago' : `${Math.round(seconds / 60)} min ago`

  const refreshNow = () => {
    onRefresh()
    setRefreshedAt(Date.now())
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-950 px-4 py-3 sm:px-5">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
          <span
            className={[
              'absolute inline-flex h-full w-full rounded-full bg-brand-400',
              following ? 'animate-ping opacity-75' : 'opacity-0',
            ].join(' ')}
          />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-400" />
        </span>
        <div>
          <p className="font-body text-sm font-semibold text-white">
            {left === null
              ? 'On the way'
              : left > 0
                ? `Arriving in about ${left} min`
                : 'Arriving any moment'}
          </p>
          <p className="font-body text-xs text-slate-400">Updated {ago}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={refreshNow}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 font-body text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Refresh
        </button>

        <button
          type="button"
          role="switch"
          aria-checked={following}
          onClick={() => setFollowing((value) => !value)}
          className="inline-flex items-center gap-2 rounded-full px-1 py-1 font-body text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
        >
          <span
            className={[
              'relative h-5 w-9 rounded-full transition',
              following ? 'bg-brand-400' : 'bg-white/25',
            ].join(' ')}
          >
            <span
              className={[
                'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                following ? 'translate-x-4' : 'translate-x-0',
              ].join(' ')}
            />
          </span>
          Follow live
        </button>
      </div>
    </div>
  )
}
