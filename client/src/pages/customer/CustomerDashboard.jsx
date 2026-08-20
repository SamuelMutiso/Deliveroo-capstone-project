import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useMemo, useState } from 'react'

import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Input from '@/components/ui/Input'
import OrderCard from '@/components/orders/OrderCard'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import { PageContainer, PageHeader } from '@/components/layout/AppShell'
import { PageSpinner } from '@/components/ui/Spinner'
import {
  fetchOrders,
  selectOrderFilters,
  selectOrders,
  selectOrdersError,
  selectOrdersMeta,
  selectOrdersStatus,
  setFilters,
} from '@/features/orders/ordersSlice'
import { useLivePoll } from '@/hooks/useLivePoll'
import { STATUS_META } from '@/utils/constants'
import { money } from '@/utils/formatters'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
]

export default function CustomerDashboard() {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const orders = useSelector(selectOrders)
  const meta = useSelector(selectOrdersMeta)
  const status = useSelector(selectOrdersStatus)
  const error = useSelector(selectOrdersError)
  const filters = useSelector(selectOrderFilters)

  const [search, setSearch] = useState(filters.search)
  const debouncedSearch = useDebounce(search)

  useEffect(() => {
    dispatch(setFilters({ search: debouncedSearch, page: 1 }))
  }, [debouncedSearch, dispatch])

  useLivePoll(() =>
    dispatch(
      fetchOrders({
        page: filters.page,
        per_page: 6,
        status: filters.status || undefined,
        search: filters.search || undefined,
      }),
    ),
  )

  useEffect(() => {
    dispatch(
      fetchOrders({
        page: filters.page,
        per_page: 6,
        status: filters.status || undefined,
        search: filters.search || undefined,
      }),
    )
  }, [dispatch, filters])

  const summary = useMemo(() => {
    const active = orders.filter((order) =>
      ['pending', 'picked_up', 'in_transit'].includes(order.status),
    )
    const outstanding = orders
      .filter((order) => order.payment_status !== 'paid' && order.status !== 'cancelled')
      .reduce((total, order) => total + order.price_kes, 0)
    return { active: active.length, outstanding }
  }, [orders])

  const isFiltered = Boolean(filters.status || filters.search)

  return (
    <PageContainer>
      <PageHeader
        eyebrow={`Hello ${user?.name?.split(' ')[0] || 'there'}`}
        title="My deliveries"
        description="Every parcel you have sent, with live status and what is still owed."
        actions={
          <Button as={Link} to="/orders/new" variant="dark">
            Send a parcel
          </Button>
        }
      />

      <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
        <Stat label="On this page" value={meta.total} caption="total deliveries" />
        <Stat label="In motion" value={summary.active} caption="not yet delivered" />
        <Stat label="Outstanding" value={money(summary.outstanding)} caption="awaiting payment" />
      </div>

      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-end">
        <Input
          label="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tracking code, recipient or destination"
          className="flex-1"
        />
        <Select
          label="Status"
          value={filters.status}
          onChange={(event) => dispatch(setFilters({ status: event.target.value, page: 1 }))}
          options={STATUS_OPTIONS}
          className="sm:w-52"
        />
      </div>

      <div className="mt-6">
        {status === 'loading' && <PageSpinner label="Loading your deliveries" />}

        {status === 'failed' && (
          <ErrorMessage
            message={error}
            onRetry={() => dispatch(fetchOrders({ page: filters.page, per_page: 6 }))}
          />
        )}

        {status === 'ready' && orders.length === 0 && (
          <EmptyState
            icon={isFiltered ? 'search' : 'parcel'}
            title={isFiltered ? 'Nothing matched that' : 'No deliveries yet'}
            message={
              isFiltered
                ? 'Try a different tracking code or clear the status filter.'
                : 'Once you send your first parcel it will show up here with live tracking.'
            }
            action={
              isFiltered ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('')
                    dispatch(setFilters({ status: '', search: '', page: 1 }))
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button as={Link} to="/orders/new" variant="dark">
                  Send your first parcel
                </Button>
              )
            }
          />
        )}

        {status === 'ready' && orders.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} to={`/orders/${order.id}`} />
              ))}
            </div>
            <Pagination
              meta={meta}
              label="deliveries"
              onChange={(page) => dispatch(setFilters({ page }))}
            />
          </>
        )}
      </div>
    </PageContainer>
  )
}

function Stat({ label, value, caption }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100">
      <p className="font-body text-xs uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1.5 font-display text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="font-body text-sm text-slate-500">{caption}</p>
    </div>
  )
}