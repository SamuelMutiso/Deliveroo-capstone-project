import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'

import Button from '@/components/ui/Button'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Input from '@/components/ui/Input'
import MapView from '@/components/map/MapView'
import OrderTimeline from '@/components/orders/OrderTimeline'
import StatusBadge from '@/components/ui/StatusBadge'
import StatusStepper from '@/components/orders/StatusStepper'
import { PageContainer } from '@/components/layout/AppShell'
import { PageSpinner } from '@/components/ui/Spinner'
import {
  advanceStage,
  fetchAssignment,
  pushLocation,
  selectAssignment,
  selectAssignmentError,
  selectAssignmentStatus,
  selectCourierSaveError,
  selectCourierSaving,
} from '@/features/couriers/couriersSlice'
import { NEXT_STAGE, STATUS, STATUS_META } from '@/utils/constants'
import { distance, duration, fullDate, money } from '@/utils/formatters'
import { useLiveLocation } from '@/hooks/useLiveLocation'
import { useLivePoll } from '@/hooks/useLivePoll'
import { useToast } from '@/hooks/useToast'

export default function CourierOrderDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()

  const order = useSelector(selectAssignment)
  const status = useSelector(selectAssignmentStatus)
  const error = useSelector(selectAssignmentError)
  const saving = useSelector(selectCourierSaving)
  const saveError = useSelector(selectCourierSaveError)

  const [manual, setManual] = useState({ lat: '', lng: '' })
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    dispatch(fetchAssignment(id))
  }, [dispatch, id])

  useLivePoll(() => dispatch(fetchAssignment(id)))

  // Declared before the loading early-return: hooks must run in the same order every render.
  const live = useLiveLocation((point) => {
    dispatch(pushLocation({ id, lat: point.lat, lng: point.lng, note: 'Live position' }))
  })

  if (status === 'loading' || (status === 'idle' && !order)) {
    return (
      <PageContainer>
        <PageSpinner label="Loading the delivery" />
      </PageContainer>
    )
  }

  if (status === 'failed') {
    return (
      <PageContainer className="max-w-xl">
        <ErrorMessage
          title="Cannot open that delivery"
          message={error}
          onRetry={() => dispatch(fetchAssignment(id))}
        />
        <div className="mt-6">
          <Button as={Link} to="/courier" variant="outline">
            Back to my route
          </Button>
        </div>
      </PageContainer>
    )
  }

  if (!order) return null

  const nextStage = NEXT_STAGE[order.status]
  const closed = order.status === STATUS.DELIVERED || order.status === STATUS.CANCELLED

  const advance = async () => {
    const result = await dispatch(advanceStage({ id: order.id, status: nextStage }))
    if (advanceStage.fulfilled.match(result)) {
      toast.success(`Marked as ${STATUS_META[nextStage].label.toLowerCase()}`)
    }
  }

  const shareBrowserLocation = () => {
    if (!navigator.geolocation) {
      toast.error('This browser cannot share your location')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocating(false)
        const result = await dispatch(
          pushLocation({
            id: order.id,
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
            note: 'Position shared from device',
          }),
        )
        if (pushLocation.fulfilled.match(result)) toast.success('Location shared')
      },
      () => {
        setLocating(false)
        toast.error('Could not read your location. Enter it manually below.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const shareManualLocation = async () => {
    const lat = Number(manual.lat)
    const lng = Number(manual.lng)
    if (Number.isNaN(lat) || Number.isNaN(lng) || (!lat && !lng)) {
      toast.error('Enter both a latitude and a longitude')
      return
    }
    const result = await dispatch(pushLocation({ id: order.id, lat, lng }))
    if (pushLocation.fulfilled.match(result)) {
      toast.success('Location updated')
      setManual({ lat: '', lng: '' })
    }
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-3.5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/courier')}
            className="-my-1.5 inline-block py-1.5 font-body text-sm text-slate-500 underline-offset-4 hover:underline"
          >
            ← My route
          </button>
          <h1 className="mt-2.5 font-display text-3xl font-bold tracking-tight text-slate-950">
            {order.tracking_code}
          </h1>
          <p className="mt-0.5 font-body text-base text-slate-500">
            {distance(order.distance_km)} · {duration(order.duration_min)} · {money(order.price_kes)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100">
        <StatusStepper status={order.status} />
      </div>

      {saveError && (
        <div className="mt-6">
          <ErrorMessage compact message={saveError} />
        </div>
      )}

      <div className="mt-6 grid gap-12 lg:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col gap-6">
          <MapView
            pickup={{ lat: order.pickup_lat, lng: order.pickup_lng }}
            destination={{ lat: order.destination_lat, lng: order.destination_lng }}
            courier={order.current_lat ? { lat: order.current_lat, lng: order.current_lng } : null}
            polyline={order.route_polyline}
          />

          <Panel title="Stops">
            <ol className="flex flex-col gap-3.5">
              <Stop
                index="1"
                tone="bg-brand-600"
                label="Collect from"
                value={order.pickup_address}
                contact={order.customer?.name}
                phone={order.customer?.phone}
              />
              <Stop
                index="2"
                tone="bg-slate-950"
                label="Deliver to"
                value={order.destination_address}
                contact={order.recipient_name}
                phone={order.recipient_phone}
              />
            </ol>
            {order.notes && (
              <p className="mt-6 rounded-xl bg-amber-100 px-3.5 py-2.5 font-body text-sm text-amber-700">
                Note from sender: {order.notes}
              </p>
            )}
          </Panel>

          <Panel title="Tracking history">
            <OrderTimeline events={order.events} />
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Advance the delivery">
            {closed ? (
              <p className="font-body text-sm text-slate-500">
                This delivery is closed. Nothing further to do.
              </p>
            ) : (
              <>
                <p className="font-body text-sm text-slate-500">
                  Current stage is {STATUS_META[order.status].label.toLowerCase()}.
                </p>
                <Button fullWidth size="lg" className="mt-3.5" loading={saving} onClick={advance}>
                  Mark as {STATUS_META[nextStage].label.toLowerCase()}
                </Button>
                <p className="mt-2.5 font-body text-xs text-slate-400">
                  Stages move in order. The customer is emailed on every change.
                </p>
              </>
            )}
          </Panel>

          <Panel title="Share your position">
            {closed ? (
              <p className="font-body text-sm text-slate-500">
                Location updates stop once a delivery is closed.
              </p>
            ) : (
              <>
                <div
                  className={`flex flex-col gap-2.5 rounded-xl p-3.5 ring-1 ring-inset ${
                    live.sharing ? 'bg-brand-100 ring-brand-300' : 'bg-slate-100 ring-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        live.sharing ? 'animate-ring bg-brand-600' : 'bg-slate-400'
                      }`}
                      aria-hidden="true"
                    />
                    <p className="font-body text-sm font-semibold text-slate-900">
                      {live.sharing ? 'Live tracking is on' : 'Live tracking is off'}
                    </p>
                  </div>
                  <p className="font-body text-xs text-slate-600">
                    {live.sharing
                      ? 'The customer sees you move on their map. Sending only when you have actually moved.'
                      : 'Turn this on and the customer follows your position on their map for the whole run.'}
                  </p>
                  <Button
                    size="sm"
                    variant={live.sharing ? 'outline' : 'primary'}
                    onClick={live.sharing ? live.stop : live.start}
                  >
                    {live.sharing ? 'Stop sharing' : 'Start live tracking'}
                  </Button>
                  {live.error && (
                    <p className="font-body text-xs text-rose-700">{live.error}</p>
                  )}
                </div>

                <Button
                  fullWidth
                  variant="dark"
                  className="mt-3.5"
                  loading={locating || saving}
                  onClick={shareBrowserLocation}
                >
                  Send my position once
                </Button>

                <div className="mt-6 border-t border-slate-100 pt-3.5">
                  <p className="font-body text-sm text-slate-500">Or enter it manually</p>
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                    <Input
                      label="Latitude"
                      type="number"
                      step="0.000001"
                      value={manual.lat}
                      onChange={(event) => setManual({ ...manual, lat: event.target.value })}
                      placeholder="-1.2921"
                    />
                    <Input
                      label="Longitude"
                      type="number"
                      step="0.000001"
                      value={manual.lng}
                      onChange={(event) => setManual({ ...manual, lng: event.target.value })}
                      placeholder="36.8219"
                    />
                  </div>
                  <Button
                    fullWidth
                    variant="outline"
                    className="mt-2.5"
                    loading={saving}
                    onClick={shareManualLocation}
                  >
                    Push location
                  </Button>
                </div>
              </>
            )}
          </Panel>

          <Panel title="Parcel">
            <dl className="flex flex-col gap-2.5">
              <Fact label="Parcel band" value={`${order.price_breakdown?.category_label} · up to ${order.weight_kg} kg`} />
              <Fact label="Booked" value={fullDate(order.created_at)} />
              <Fact label="Sender" value={order.customer?.name} />
            </dl>
          </Panel>
        </div>
      </div>
    </PageContainer>
  )
}

function Panel({ title, children }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100">
      <h2 className="font-display text-xl font-semibold text-slate-950">{title}</h2>
      <div className="mt-3.5">{children}</div>
    </section>
  )
}

function Stop({ index, tone, label, value, contact, phone }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs text-white ${tone}`}
      >
        {index}
      </span>
      <div>
        <p className="font-body text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p>
        <p className="font-body text-base text-slate-800">{value}</p>
        {contact && (
          <p className="mt-0.5 font-body text-sm text-slate-500">
            {contact}
            {phone ? ` · ` : ''}
            {phone && (
              <a href={`tel:${phone}`} className="font-mono text-brand-700 underline-offset-4 hover:underline">
                {phone}
              </a>
            )}
          </p>
        )}
      </div>
    </li>
  )
}

function Fact({ label, value }) {
  return (
    <div>
      <dt className="font-body text-xs uppercase tracking-[0.12em] text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-body text-base text-slate-800">{value || '—'}</dd>
    </div>
  )
}