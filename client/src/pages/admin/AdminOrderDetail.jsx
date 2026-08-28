import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'

import Button from '@/components/ui/Button'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Input from '@/components/ui/Input'
import MapView from '@/components/map/MapView'
import OrderTimeline from '@/components/orders/OrderTimeline'
import PriceBreakdown from '@/components/orders/PriceBreakdown'
import Select from '@/components/ui/Select'
import StatusBadge, { PaymentBadge } from '@/components/ui/StatusBadge'
import StatusStepper from '@/components/orders/StatusStepper'
import { PageContainer } from '@/components/layout/AppShell'
import { PageSpinner } from '@/components/ui/Spinner'
import {
  assignCourier,
  fetchAdminOrder,
  fetchCouriers,
  selectAdminDetailError,
  selectAdminDetailStatus,
  selectAdminOrder,
  selectAdminSaveError,
  selectAdminSaving,
  selectCouriersList,
  setOrderLocation,
  setOrderStatus,
} from '@/features/admin/adminSlice'
import { STATUS_META } from '@/utils/constants'
import { distance, duration, fullDate, money } from '@/utils/formatters'
import { useToast } from '@/hooks/useToast'

const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

export default function AdminOrderDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()

  const order = useSelector(selectAdminOrder)
  const status = useSelector(selectAdminDetailStatus)
  const error = useSelector(selectAdminDetailError)
  const couriers = useSelector(selectCouriersList)
  const saving = useSelector(selectAdminSaving)
  const saveError = useSelector(selectAdminSaveError)

  const [courierId, setCourierId] = useState('')
  const [nextStatus, setNextStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [position, setPosition] = useState({ lat: '', lng: '' })

  useEffect(() => {
    dispatch(fetchAdminOrder(id))
    dispatch(fetchCouriers())
  }, [dispatch, id])

  const orderId = order?.id ?? null
  const serverCourierId = order?.courier?.id ?? null
  const serverStatus = order?.status ?? null

  useEffect(() => {
    if (!orderId) return
    setCourierId(serverCourierId ? String(serverCourierId) : '')
    setNextStatus(serverStatus)
    // Keyed on the server's own values rather than the order object: polling hands back a new
    // object every few seconds and would otherwise wipe a choice the admin has not saved yet.
  }, [orderId, serverCourierId, serverStatus])

  if (status === 'loading' || (status === 'idle' && !order)) {
    return (
      <PageContainer>
        <PageSpinner label="Loading the order" />
      </PageContainer>
    )
  }

  if (status === 'failed') {
    return (
      <PageContainer className="max-w-xl">
        <ErrorMessage message={error} onRetry={() => dispatch(fetchAdminOrder(id))} />
        <div className="mt-6">
          <Button as={Link} to="/admin/orders" variant="outline">
            Back to orders
          </Button>
        </div>
      </PageContainer>
    )
  }

  if (!order) return null

  const handleAssign = async () => {
    if (!courierId) return
    const result = await dispatch(assignCourier({ id: order.id, courierId: Number(courierId) }))
    if (assignCourier.fulfilled.match(result)) {
      toast.success('Courier assigned and notified')
      dispatch(fetchCouriers())
    }
  }

  const handleStatus = async () => {
    if (!nextStatus || nextStatus === order.status) return
    const result = await dispatch(
      setOrderStatus({ id: order.id, status: nextStatus, note: statusNote.trim() || undefined }),
    )
    if (setOrderStatus.fulfilled.match(result)) {
      toast.success(`Status set to ${STATUS_META[nextStatus].label.toLowerCase()}`)
      setStatusNote('')
    }
  }

  const handleLocation = async () => {
    const lat = Number(position.lat)
    const lng = Number(position.lng)
    if (Number.isNaN(lat) || Number.isNaN(lng) || (!position.lat && !position.lng)) {
      toast.error('Enter both a latitude and a longitude')
      return
    }
    const result = await dispatch(setOrderLocation({ id: order.id, lat, lng }))
    if (setOrderLocation.fulfilled.match(result)) {
      toast.success('Parcel location corrected')
      setPosition({ lat: '', lng: '' })
    }
  }

  const AVAILABILITY_LABEL = {
    available: 'on duty',
    busy: 'on duty, busy',
    offline: 'off duty',
  }

  const courierOptions = couriers.map((courier) => ({
    value: String(courier.id),
    label: `${courier.name} · ${AVAILABILITY_LABEL[courier.availability]} · ${courier.active_orders} active`,
  }))

  const chosenCourier = couriers.find((courier) => String(courier.id) === courierId)

  return (
    <PageContainer>
      <div className="flex flex-col gap-3.5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/orders')}
            className="-my-1.5 inline-block py-1.5 font-body text-sm text-slate-500 underline-offset-4 hover:underline"
          >
            ← All orders
          </button>
          <h1 className="mt-2.5 font-display text-3xl font-bold tracking-tight text-slate-950">
            {order.tracking_code}
          </h1>
          <p className="mt-0.5 font-body text-base text-slate-500">
            {order.customer?.name} · {order.customer?.email} · booked {fullDate(order.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge status={order.status} />
          <PaymentBadge status={order.payment_status} />
        </div>
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

          <Panel title="Route and parcel">
            <div className="flex flex-col gap-3.5">
              <Leg tone="bg-brand-600" label="Pickup" value={order.pickup_address} />
              <Leg tone="bg-slate-950" label="Destination" value={order.destination_address} />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-3.5 border-t border-slate-100 pt-3.5 sm:grid-cols-4">
              <Fact label="Distance" value={distance(order.distance_km)} />
              <Fact label="Est. time" value={duration(order.duration_min)} />
              <Fact label="Parcel band" value={order.price_breakdown?.category_label} />
              <Fact label="Value" value={money(order.price_kes)} />
            </dl>
            <dl className="mt-3.5 grid grid-cols-2 gap-3.5 border-t border-slate-100 pt-3.5">
              <Fact label="Recipient" value={order.recipient_name} />
              <Fact label="Recipient phone" value={order.recipient_phone} mono />
              <Fact label="Recipient email" value={order.recipient_email} />
            </dl>
            {order.notes && (
              <p className="mt-3.5 rounded-xl bg-slate-50 px-3.5 py-2.5 font-body text-sm text-slate-600">
                {order.notes}
              </p>
            )}
          </Panel>

          <Panel title="Tracking history">
            <OrderTimeline events={order.events} />
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Assign a courier">
            <Select
              label="Courier"
              value={courierId}
              onChange={(event) => setCourierId(event.target.value)}
              options={courierOptions}
              placeholder="Choose a courier"
              hint="Riders set their own availability. Off-duty riders are listed last."
            />
            {chosenCourier && chosenCourier.availability === 'offline' && (
              <p className="mt-2.5 rounded-xl bg-amber-100 px-3.5 py-2.5 font-body text-sm text-amber-800">
                {chosenCourier.name} is off duty right now. You can still assign this delivery, but
                they may not pick it up until they come back on.
              </p>
            )}
            <Button
              fullWidth
              className="mt-3.5"
              loading={saving}
              disabled={!courierId || String(order.courier?.id) === courierId}
              onClick={handleAssign}
            >
              {order.courier ? 'Reassign' : 'Assign courier'}
            </Button>
            {order.courier && (
              <p className="mt-2.5 font-body text-sm text-slate-500">
                Currently with {order.courier.name} · {order.courier.phone}
              </p>
            )}
          </Panel>

          <Panel title="Override status">
            <Select
              label="Status"
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value)}
              options={STATUS_OPTIONS}
            />
            <Input
              label="Note"
              className="mt-3.5"
              value={statusNote}
              onChange={(event) => setStatusNote(event.target.value)}
              placeholder="Why is this changing?"
              hint="Appears on the customer's timeline"
            />
            <Button
              fullWidth
              variant="dark"
              className="mt-3.5"
              loading={saving}
              disabled={nextStatus === order.status}
              onClick={handleStatus}
            >
              Apply status
            </Button>
          </Panel>

          <Panel title="Correct parcel location">
            <div className="grid grid-cols-2 gap-2.5">
              <Input
                label="Latitude"
                type="number"
                step="0.000001"
                value={position.lat}
                onChange={(event) => setPosition({ ...position, lat: event.target.value })}
                placeholder="-1.2921"
              />
              <Input
                label="Longitude"
                type="number"
                step="0.000001"
                value={position.lng}
                onChange={(event) => setPosition({ ...position, lng: event.target.value })}
                placeholder="36.8219"
              />
            </div>
            <Button fullWidth variant="outline" className="mt-3.5" loading={saving} onClick={handleLocation}>
              Move parcel
            </Button>
          </Panel>

          <PriceBreakdown quote={order.price_breakdown} compact />
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

function Leg({ tone, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className={`mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full ${tone}`} aria-hidden="true" />
      <div>
        <p className="font-body text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p>
        <p className="font-body text-base text-slate-800">{value}</p>
      </div>
    </div>
  )
}

function Fact({ label, value, mono }) {
  return (
    <div>
      <dt className="font-body text-xs uppercase tracking-[0.12em] text-slate-400">{label}</dt>
      <dd className={`mt-0.5 text-base text-slate-800 ${mono ? 'font-mono' : 'font-body'}`}>
        {value || '—'}
      </dd>
    </div>
  )
}
