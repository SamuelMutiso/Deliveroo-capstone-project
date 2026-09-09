import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { money } from '@/utils/formatters'

const BAR_FILL = '#eba800'
const GRID = '#e9edf0'
const AXIS = '#94a3b8'

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function dayLabel(iso) {
  const parsed = new Date(`${iso}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? iso : WEEKDAY[parsed.getDay()]
}

export default function EarningsPanel({ stats }) {
  const earnings = stats?.earnings
  const rate = stats?.commission_rate ? Math.round(stats.commission_rate * 100) : null

  const data = (stats?.daily || []).map((day) => ({
    ...day,
    label: dayLabel(day.date),
  }))

  const best = data.reduce(
    (top, day) => (day.earnings_kes > (top?.earnings_kes ?? -1) ? day : top),
    null,
  )
  const hasEarnings = data.some((day) => day.earnings_kes > 0)

  return (
    <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-inset ring-slate-100 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-slate-950">
            Your earnings
          </h2>
          <p className="font-body text-sm text-slate-500">
            {rate ? `${rate}% of every delivery you complete` : 'Paid on completed deliveries'}
          </p>
        </div>
        {best && best.earnings_kes > 0 && (
          <p className="font-body text-sm text-slate-500">
            Best day this week ·{' '}
            <span className="font-semibold text-slate-900">
              {best.label} {money(best.earnings_kes)}
            </span>
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <Figure label="Today" value={earnings?.today} accent />
        <Figure label="This week" value={earnings?.week} />
        <Figure label="This month" value={earnings?.month} />
        <Figure label="All time" value={earnings?.lifetime} />
      </div>

      <div className="mt-6 h-56 w-full sm:h-64">
        {hasEarnings ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: AXIS, fontSize: 12, fontFamily: 'Manrope, sans-serif' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tick={{ fill: AXIS, fontSize: 12, fontFamily: 'Manrope, sans-serif' }}
                tickFormatter={(value) => (value >= 1000 ? `${value / 1000}k` : value)}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e9edf0',
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: 13,
                }}
                formatter={(value, _name, entry) => [
                  `${money(value)} · ${entry.payload.deliveries} ${
                    entry.payload.deliveries === 1 ? 'delivery' : 'deliveries'
                  }`,
                  'Earned',
                ]}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
              />
              <Bar dataKey="earnings_kes" fill={BAR_FILL} radius={[4, 4, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-xl bg-slate-50 px-6 text-center">
            <p className="font-body text-sm font-semibold text-slate-700">
              No earnings yet this week
            </p>
            <p className="mt-1 font-body text-sm text-slate-500">
              Complete a delivery and it will show up here the same day.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function Figure({ label, value, accent }) {
  return (
    <div
      className={[
        'rounded-xl px-4 py-3.5 ring-1 ring-inset',
        accent ? 'bg-brand-400 ring-brand-400' : 'bg-slate-50 ring-slate-100',
      ].join(' ')}
    >
      <p
        className={[
          'font-body text-xs uppercase tracking-[0.14em]',
          accent ? 'text-brand-950/70' : 'text-slate-400',
        ].join(' ')}
      >
        {label}
      </p>
      <p
        className={[
          'mt-0.5 font-display text-2xl font-bold tracking-tight',
          accent ? 'text-brand-950' : 'text-slate-950',
        ].join(' ')}
      >
        {value === undefined || value === null ? '—' : money(value)}
      </p>
    </div>
  )
}
