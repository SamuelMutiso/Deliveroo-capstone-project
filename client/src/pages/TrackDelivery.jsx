import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { PackageSearch } from 'lucide-react'

import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { PageContainer } from '@/components/layout/AppShell'
import { STATUS_META } from '@/utils/constants'
import { fullDate } from '@/utils/formatters'
import { publicApi } from '@/api/publicApi'

const STAGES = ['pending', 'picked_up', 'in_transit', 'delivered']

const MESSAGE_BY_STATUS = {
  404: 'No parcel with that tracking code. Check it and try again.',
  410: 'This tracking code has expired. Codes stop working a week after a parcel is closed. Sign in to see your delivery history.',
  429: 'Too many lookups from this connection. Give it a minute and try again.',
}

export default function TrackDelivery() {
  const { code } = useParams()
  const navigate = useNavigate()

  const [entry, setEntry] = useState('')
  const [parcel, setParcel] = useState(null)
  const [error, setError] = useState(null)
  const [looking, setLooking] = useState(Boolean(code))

  useEffect(() => {
    if (!code) {
      setParcel(null)
      setError(null)
      setLooking(false)
      return
    }

    let live = true
    setLooking(true)
    setError(null)
    setParcel(null)

    publicApi
      .track(code)
      .then((data) => {
        if (live) setParcel(data.parcel)
      })
      .catch((requestError) => {
        if (!live) return
        const status = requestError?.response?.status
        setError(MESSAGE_BY_STATUS[status] || 'Tracking is unavailable right now.')
      })
      .finally(() => {
        if (live) setLooking(false)
      })

    return () => {
      live = false
    }
  }, [code])

  const submit = (event) => {
    event.preventDefault()
    const trimmed = entry.trim().toUpperCase()
    if (trimmed) navigate(`/track/${encodeURIComponent(trimmed)}`)
  }

  const reached = parcel ? STAGES.indexOf(parcel.status) : -1

  return (
    <PageContainer className="max-w-2xl">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">
          Track a parcel
        </h1>
        <p className="mt-2 font-body text-base text-slate-500">
          Enter the code from your booking confirmation.
        </p>
      </div>

      <form onSubmit={submit} className="mx-auto mt-7 flex max-w-md flex-col gap-2.5 sm:flex-row">
        <input
          value={entry}
          onChange={(event) => setEntry(event.target.value)}
          placeholder="DLV-XXXXXX"
          aria-label="Tracking code"
          className="h-12 w-full rounded-full bg-white px-5 font-mono text-base uppercase text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:font-body placeholder:normal-case placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <Button type="submit" size="lg" className="shrink-0">
          Track it
        </Button>
      </form>

      {looking && (
        <div className="mt-10 flex justify-center">
          <Spinner />
        </div>
      )}

      {error && !looking && (
        <div className="mx-auto mt-8 max-w-md rounded-2xl bg-slate-50 p-6 text-center ring-1 ring-inset ring-slate-100">
          <PackageSearch className="mx-auto h-7 w-7 text-slate-300" aria-hidden="true" />
          <p className="mt-3 font-body text-sm text-slate-600">{error}</p>
          <Link
            to="/login"
            className="mt-4 inline-block font-body text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            Sign in to your account
          </Link>
        </div>
      )}

      {parcel && !looking && (
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono text-sm text-slate-400">{parcel.tracking_code}</p>
            <p className="font-display text-2xl font-bold tracking-tight text-slate-950">
              {STATUS_META[parcel.status]?.label || parcel.status}
            </p>
          </div>

          <ol className="mt-6 flex flex-col gap-3.5">
            {STAGES.map((stage, index) => {
              const done = parcel.status === 'cancelled' ? false : index <= reached
              return (
                <li key={stage} className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      done ? 'bg-brand-400' : 'bg-slate-200'
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`font-body text-sm ${done ? 'font-semibold text-slate-900' : 'text-slate-400'}`}
                  >
                    {STATUS_META[stage]?.label}
                  </span>
                </li>
              )
            })}
          </ol>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
            <div>
              <dt className="font-body text-[10px] uppercase tracking-[0.14em] text-slate-400">
                Distance
              </dt>
              <dd className="mt-0.5 font-body text-sm text-slate-900">{parcel.distance_km} km</dd>
            </div>
            <div>
              <dt className="font-body text-[10px] uppercase tracking-[0.14em] text-slate-400">
                Booked
              </dt>
              <dd className="mt-0.5 font-body text-sm text-slate-900">
                {parcel.created_at ? fullDate(parcel.created_at) : '—'}
              </dd>
            </div>
          </dl>

          <p className="mt-5 font-body text-xs text-slate-400">
            Addresses and contact details stay private. Sign in to see the full delivery.
            {parcel.expires_at
              ? ` This code stops working on ${fullDate(parcel.expires_at)}.`
              : ''}
          </p>
        </div>
      )}
    </PageContainer>
  )
}
