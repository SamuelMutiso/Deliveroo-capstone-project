import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'

import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ErrorMessage from '@/components/ui/ErrorMessage'
import OrderCard from '@/components/orders/OrderCard'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import { PageContainer, PageHeader } from '@/components/layout/AppShell'
import { PageSpinner } from '@/components/ui/Spinner'
import {
  fetchAssignments,
  fetchCourierStats,
  hydrateAvailability,
  selectAvailabilitySaving,
  selectIsAvailable,
  setAvailability,
  selectAssignments,
  selectAssignmentsError,
  selectAssignmentsMeta,
  selectAssignmentsStatus,
  selectCourierFilters,
  selectCourierStats,
  setCourierFilters,
} from '@/features/couriers/couriersSlice'
import { STATUS_META } from '@/utils/constants'
import { distance } from '@/utils/formatters'
import { restoreSession } from '@/features/auth/authSlice'
import { useAuth } from '@/hooks/useAuth'
import { useLivePoll } from '@/hooks/useLivePoll'
import { useToast } from '@/hooks/useToast'

const STATUS_OPTIONS = [
  { value: '', label: 'Everything assigned' },
  ...Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
]

export default function CourierDashboard() {
  const dispatch = useDispatch()
  const toast = useToast()
  const { user } = useAuth()

  const orders = useSelector(selectAssignments)
  const meta = useSelector(selectAssignmentsMeta)
  const status = useSelector(selectAssignmentsStatus)
  const error = useSelector(selectAssignmentsError)
  const filters = useSelector(selectCourierFilters)
  const stats = useSelector(selectCourierStats)
  const isAvailable = useSelector(selectIsAvailable)
  const availabilitySaving = useSelector(selectAvailabilitySaving)

  useEffect(() => {
    dispatch(fetchCourierStats())
  }, [dispatch])

  useEffect(() => {
    dispatch(hydrateAvailability(user?.is_available))
  }, [dispatch, user?.is_available])

  useLivePoll(() => {
    dispatch(fetchCourierStats())
    dispatch(
      fetchAssignments({
        page: filters.page,
        per_page: 6,
        status: filters.status || undefined,
      }),
    )
  })

  const toggleAvailability = async () => {
    const next = !isAvailable
    const result = await dispatch(setAvailability(next))
    if (setAvailability.fulfilled.match(result)) {
      // The session user still carries the value it had at sign-in. Refresh it, or
      // navigating away and back would flip the toggle to the stale value.
      dispatch(restoreSession())
      toast.success(next ? 'You are on duty' : 'You are off duty')
    } else {
      toast.error(result.payload || 'Could not change your availability')
    }
  }

  useEffect(() => {
    dispatch(
      fetchAssignments({
        page: filters.page,
        per_page: 6,
        status: filters.status || undefined,
      }),
    )
  }, [dispatch, filters])

  return (
    <PageContainer>
      <AvailabilityCard
        isAvailable={isAvailable}
        saving={availabilitySaving}
        onToggle={toggleAvailability}
      />

      <PageHeader
        eyebrow={`${isAvailable ? 'On duty' : 'Off duty'} · ${user?.vehicle || 'no vehicle set'}`}
        title="My route"
        description="Deliveries assigned to you. Open one to advance the stage or share your position."
      />

      <div className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active" value={stats?.active ?? '—'} caption="on the road now" accent />
        <Stat label="Delivered" value={stats?.delivered ?? '—'} caption="all time" />
        <Stat label="This week" value={stats?.delivered_this_week ?? '—'} caption="completed runs" />
        <Stat
          label="Covered"
          value={stats ? distance(stats.distance_km) : '—'}
          caption="delivered distance"
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Select
          label="Filter"
          value={filters.status}
          onChange={(event) => dispatch(setCourierFilters({ status: event.target.value, page: 1 }))}
          options={STATUS_OPTIONS}
          className="sm:w-60"
        />
      </div>

      <div className="mt-6">
        {status === 'loading' && <PageSpinner label="Loading your route" />}

        {status === 'failed' && (
          <ErrorMessage message={error} onRetry={() => dispatch(fetchAssignments({ page: 1 }))} />
        )}

        {status === 'ready' && orders.length === 0 && (
          <EmptyState
            title="Nothing on your route"
            message="When operations assigns you a parcel it will appear here with the pickup and drop-off."
            action={
              filters.status ? (
                <Button variant="outline" onClick={() => dispatch(setCourierFilters({ status: '', page: 1 }))}>
                  Show everything
                </Button>
              ) : null
            }
          />
        )}

        {status === 'ready' && orders.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  to={`/courier/${order.id}`}
                  showPayment={false}
                />
              ))}
            </div>
            <Pagination
              meta={meta}
              label="deliveries"
              onChange={(page) => dispatch(setCourierFilters({ page }))}
            />
          </>
        )}
      </div>
    </PageContainer>
  )
}

function Stat({ label, value, caption, accent }) {
  return (
    <div
      className={[
        'rounded-2xl p-6 shadow-sm ring-1 ring-inset',
        accent ? 'bg-slate-950 ring-slate-950' : 'bg-white ring-slate-100',
      ].join(' ')}
    >
      <p
        className={[
          'font-body text-xs uppercase tracking-[0.14em]',
          accent ? 'text-slate-400' : 'text-slate-400',
        ].join(' ')}
      >
        {label}
      </p>
      <p
        className={[
          'mt-1.5 font-display text-3xl font-bold tracking-tight',
          accent ? 'text-white' : 'text-slate-950',
        ].join(' ')}
      >
        {value}
      </p>
      <p className={`font-body text-sm ${accent ? 'text-slate-400' : 'text-slate-500'}`}>{caption}</p>
    </div>
  )
}

function AvailabilityCard({ isAvailable, saving, onToggle }) {
  return (
    <div className="mb-6 flex flex-col gap-3.5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-inset ring-slate-100 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-center gap-3.5">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full ${
            isAvailable ? 'bg-emerald-100' : 'bg-slate-100'
          }`}
        >
          <span
            className={`h-3 w-3 rounded-full ${isAvailable ? 'animate-ring bg-emerald-500' : 'bg-slate-400'}`}
          />
        </span>
        <div>
          <p className="font-display text-lg font-semibold text-slate-950">
            {isAvailable ? 'You are on duty' : 'You are off duty'}
          </p>
          <p className="font-body text-sm text-slate-500">
            {isAvailable
              ? 'Operations can assign you new deliveries.'
              : 'Operations will not assign you anything new until you go on duty.'}
          </p>
        </div>
      </div>

      <Button
        onClick={onToggle}
        loading={saving}
        variant={isAvailable ? 'outline' : 'primary'}
        className="sm:shrink-0"
      >
        {isAvailable ? 'Go off duty' : 'Go on duty'}
      </Button>
    </div>
  )
}