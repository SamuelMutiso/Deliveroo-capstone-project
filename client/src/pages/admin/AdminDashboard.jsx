import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import Button from '@/components/ui/Button'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { PageContainer, PageHeader } from '@/components/layout/AppShell'
import { PageSpinner } from '@/components/ui/Spinner'
import {
  fetchStats,
  selectStats,
  selectStatsError,
  selectStatsStatus,
} from '@/features/admin/adminSlice'
import { STATUS_META } from '@/utils/constants'
import { money, shortDate } from '@/utils/formatters'

const SLICE_COLORS = {
  pending: '#739296',
  picked_up: '#3f6fe4',
  in_transit: '#7c3aed',
  delivered: '#059669',
  cancelled: '#e0483c',
}

export default function AdminDashboard() {
  const dispatch = useDispatch()
  const stats = useSelector(selectStats)
  const status = useSelector(selectStatsStatus)
  const error = useSelector(selectStatsError)

  useEffect(() => {
    dispatch(fetchStats())
  }, [dispatch])

  if (status === 'loading' || status === 'idle') {
    return (
      <PageContainer>
        <PageSpinner label="Building the dashboard" />
      </PageContainer>
    )
  }

  if (status === 'failed') {
    return (
      <PageContainer className="max-w-xl">
        <ErrorMessage message={error} onRetry={() => dispatch(fetchStats())} />
      </PageContainer>
    )
  }

  const { totals, by_status: byStatus, daily, couriers } = stats

  const pieData = Object.entries(byStatus)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({ name: STATUS_META[key]?.label || key, value: count, key }))

  const trend = daily.map((point) => ({ ...point, label: shortDate(point.date) }))

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Operations"
        title="Delivery overview"
        description="Volume, fulfilment and courier performance across the whole network."
        actions={
          <>
            <Button as={Link} to="/admin/orders?status=pending" variant="outline">
              Unassigned queue
            </Button>
            <Button as={Link} to="/admin/orders" variant="dark">
              Manage orders
            </Button>
          </>
        }
      />

      <div className="mt-6 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Total orders"
          value={totals.orders}
          caption="all time"
          to="/admin/orders"
        />
        <Stat
          label="In motion"
          value={totals.active}
          caption="not yet closed"
          accent
          to="/admin/orders?status=active"
        />
        <Stat
          label="Needs a courier"
          value={totals.unassigned}
          caption="waiting on assignment"
          warn={totals.unassigned > 0}
          to="/admin/orders?status=pending&courier_id=unassigned"
        />
        <Stat
          label="Revenue"
          value={money(totals.revenue_kes)}
          caption="from delivered runs"
          to="/admin/orders?status=delivered"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Last seven days" caption="Orders created against orders delivered">
          <div className="h-[17rem] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="createdFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3f6fe4" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#3f6fe4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="deliveredFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e9edf0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#739296', fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#739296', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e9edf0',
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: 13,
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 13 }}
                />
                <Area
                  type="monotone"
                  dataKey="created"
                  name="Created"
                  stroke="#3f6fe4"
                  strokeWidth={2}
                  fill="url(#createdFill)"
                />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  name="Delivered"
                  stroke="#059669"
                  strokeWidth={2}
                  fill="url(#deliveredFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Status mix" caption="Where every parcel currently sits">
          <div className="h-[17rem] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="52%"
                  outerRadius="82%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {pieData.map((slice) => (
                    <Cell key={slice.key} fill={SLICE_COLORS[slice.key] || '#739296'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e9edf0',
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: 13,
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Courier performance" caption="Assignments, completions and distance covered">
          {couriers.length === 0 ? (
            <p className="font-body text-sm text-slate-500">No active couriers yet.</p>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {couriers.map((courier) => (
                <li key={courier.id} className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2.5">
                    <p className="font-body text-base font-semibold text-slate-900">{courier.name}</p>
                    <p className="font-mono text-sm text-slate-500">
                      {courier.delivered}/{courier.assigned} delivered · {courier.distance_km} km
                    </p>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
                    role="img"
                    aria-label={`${courier.completion_rate} percent completion`}
                  >
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all"
                      style={{ width: `${courier.completion_rate}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </PageContainer>
  )
}

function Stat({ label, value, caption, accent, warn, to }) {
  const Tag = to ? Link : 'div'
  return (
    <Tag
      {...(to ? { to } : {})}
      className={[
        'block rounded-2xl p-6 shadow-sm ring-1 ring-inset transition',
        to ? 'hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600' : '',
        accent ? 'bg-slate-950 ring-slate-950' : warn ? 'bg-amber-100 ring-amber-300/60' : 'bg-white ring-slate-100',
      ].join(' ')}
    >
      <p
        className={`font-body text-xs uppercase tracking-[0.14em] ${
          accent ? 'text-slate-400' : warn ? 'text-amber-700' : 'text-slate-400'
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1.5 font-display text-3xl font-bold tracking-tight ${
          accent ? 'text-white' : 'text-slate-950'
        }`}
      >
        {value}
      </p>
      <p className={`font-body text-sm ${accent ? 'text-slate-400' : 'text-slate-500'}`}>{caption}</p>
      {to && (
        <p
          className={`mt-2.5 font-body text-xs font-semibold ${
            accent ? 'text-brand-300' : warn ? 'text-amber-800' : 'text-brand-700'
          }`}
        >
          Open this list →
        </p>
      )}
    </Tag>
  )
}

function Panel({ title, caption, children }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100">
      <div>
        <h2 className="font-display text-xl font-semibold text-slate-950">{title}</h2>
        {caption && <p className="mt-0.5 font-body text-sm text-slate-500">{caption}</p>}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  )
}
