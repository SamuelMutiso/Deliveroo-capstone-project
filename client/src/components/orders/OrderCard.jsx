import { Link } from 'react-router-dom'

import StatusBadge, { PaymentBadge } from '@/components/ui/StatusBadge'
import { distance, money, relativeTime } from '@/utils/formatters'

export default function OrderCard({ order, to, showPayment = true }) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-3.5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 transition hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <div className="flex items-start justify-between gap-3.5">
        <div>
          <p className="font-mono text-xs tracking-wide text-slate-400">{order.tracking_code}</p>
          <p className="mt-0.5 font-display text-xl font-semibold text-slate-950">
            {money(order.price_kes)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={order.status} size="sm" />
          {showPayment && <PaymentBadge status={order.payment_status} size="sm" />}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Leg tone="bg-brand-600" label={order.pickup_address} />
        <span className="ml-[5px] h-3 w-px bg-slate-200" aria-hidden="true" />
        <Leg tone="bg-slate-950" label={order.destination_address} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-3.5">
        <p className="font-body text-sm text-slate-500">
          {order.courier ? order.courier.name : 'Awaiting courier'} · {distance(order.distance_km)}
        </p>
        <p className="font-body text-xs text-slate-400">{relativeTime(order.created_at)}</p>
      </div>
    </Link>
  )
}

function Leg({ tone, label }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className={`mt-[6px] h-2.5 w-2.5 shrink-0 rounded-full ${tone}`} aria-hidden="true" />
      <p className="font-body text-base text-slate-700 line-clamp-1">{label}</p>
    </div>
  )
}