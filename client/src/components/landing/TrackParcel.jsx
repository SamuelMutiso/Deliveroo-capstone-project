import { useState } from 'react'

import Button from '@/components/ui/Button'
import { STATUS_META } from '@/utils/constants'
import { fullDate } from '@/utils/formatters'
import { publicApi } from '@/api/publicApi'

const STAGES = ['pending', 'picked_up', 'in_transit', 'delivered']

export default function TrackParcel() {
  const [code, setCode] = useState('')
  const [parcel, setParcel] = useState(null)
  const [error, setError] = useState(null)
  const [looking, setLooking] = useState(false)

  const track = async (event) => {
    event.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return

    setLooking(true)
    setError(null)
    setParcel(null)

    try {
      const data = await publicApi.track(trimmed)
      setParcel(data.parcel)
    } catch (requestError) {
      setError(
        requestError?.response?.status === 404
          ? 'No parcel with that code. Check it and try again.'
          : 'Tracking is unavailable right now.',
      )
    } finally {
      setLooking(false)
    }
  }

  const reached = parcel ? STAGES.indexOf(parcel.status) : -1

  return (
    <div>
      <form onSubmit={track} className="flex flex-col gap-2.5 sm:flex-row">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Enter your tracking code"
          aria-label="Tracking code"
          className="w-full rounded-full bg-white/10 px-5 py-3 font-mono text-base uppercase text-white placeholder:normal-case placeholder:font-body ring-1 ring-inset ring-white/20 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <Button type="submit" size="lg" className="shrink-0" loading={looking}>
          Track it
        </Button>
      </form>

      {error && (
        <p className="mt-3.5 font-body text-sm text-brand-300">{error}</p>
      )}

      {parcel && (
        <div className="mt-6 rounded-2xl bg-white/5 p-5 ring-1 ring-inset ring-white/10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono text-sm text-white/60">{parcel.tracking_code}</p>
            <p className="font-display text-xl font-semibold text-white">
              {STATUS_META[parcel.status]?.label || parcel.status}
            </p>
          </div>

          <ol className="mt-5 flex flex-col gap-3">
            {STAGES.map((stage, index) => {
              const done = parcel.status === 'cancelled' ? false : index <= reached
              return (
                <li key={stage} className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      done ? 'bg-brand-400' : 'bg-white/20'
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`font-body text-sm ${done ? 'text-white' : 'text-white/40'}`}
                  >
                    {STATUS_META[stage]?.label}
                  </span>
                </li>
              )
            })}
          </ol>

          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
            <div>
              <dt className="font-body text-[10px] uppercase tracking-[0.14em] text-white/40">
                Distance
              </dt>
              <dd className="mt-0.5 font-body text-sm text-white">{parcel.distance_km} km</dd>
            </div>
            <div>
              <dt className="font-body text-[10px] uppercase tracking-[0.14em] text-white/40">
                Booked
              </dt>
              <dd className="mt-0.5 font-body text-sm text-white">
                {parcel.created_at ? fullDate(parcel.created_at) : '—'}
              </dd>
            </div>
          </dl>

          <p className="mt-4 font-body text-xs text-white/40">
            Addresses and contact details stay private. Sign in to see the full delivery.
          </p>
        </div>
      )}
    </div>
  )
}
