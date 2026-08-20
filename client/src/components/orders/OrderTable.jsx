import { Link } from 'react-router-dom'

import StatusBadge, { PaymentBadge } from '@/components/ui/StatusBadge'
import { distance, money, shortDate } from '@/utils/formatters'

export default function OrderTable({ orders, basePath = '/admin/orders' }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-inset ring-slate-100">
      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {['Tracking', 'Customer', 'Route', 'Courier', 'Status', 'Payment', 'Value', ''].map(
                (heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-3.5 py-2.5 font-body text-xs font-semibold uppercase tracking-[0.1em] text-slate-500"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                <td className="px-3.5 py-3.5">
                  <p className="font-mono text-sm text-slate-800">{order.tracking_code}</p>
                  <p className="font-body text-xs text-slate-400">{shortDate(order.created_at)}</p>
                </td>
                <td className="px-3.5 py-3.5">
                  <p className="font-body text-sm text-slate-800">{order.customer?.name}</p>
                  <p className="font-body text-xs text-slate-400">{order.customer?.email}</p>
                </td>
                <td className="max-w-[16rem] px-3.5 py-3.5">
                  <p className="truncate font-body text-sm text-slate-700">{order.pickup_address}</p>
                  <p className="truncate font-body text-xs text-slate-400">
                    → {order.destination_address}
                  </p>
                </td>
                <td className="px-3.5 py-3.5">
                  {order.courier ? (
                    <p className="font-body text-sm text-slate-700">{order.courier.name}</p>
                  ) : (
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 font-body text-xs font-semibold text-amber-700">
                      Unassigned
                    </span>
                  )}
                </td>
                <td className="px-3.5 py-3.5">
                  <StatusBadge status={order.status} size="sm" />
                </td>
                <td className="px-3.5 py-3.5">
                  <PaymentBadge status={order.payment_status} size="sm" />
                </td>
                <td className="px-3.5 py-3.5">
                  <p className="font-mono text-sm text-slate-800">{money(order.price_kes)}</p>
                  <p className="font-body text-xs text-slate-400">{distance(order.distance_km)}</p>
                </td>
                <td className="px-3.5 py-3.5 text-right">
                  <Link
                    to={`${basePath}/${order.id}`}
                    className="font-body text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-slate-100 xl:hidden">
        {orders.map((order) => (
          <li key={order.id}>
            <Link to={`${basePath}/${order.id}`} className="flex flex-col gap-2.5 p-6">
              <div className="flex items-start justify-between gap-3.5">
                <div>
                  <p className="font-mono text-xs text-slate-400">{order.tracking_code}</p>
                  <p className="font-display text-base font-semibold text-slate-950">
                    {money(order.price_kes)}
                  </p>
                </div>
                <StatusBadge status={order.status} size="sm" />
              </div>
              <p className="font-body text-sm text-slate-600">
                {order.customer?.name} · {order.courier?.name || 'Unassigned'}
              </p>
              <p className="font-body text-xs text-slate-400 line-clamp-1">
                {order.pickup_address} → {order.destination_address}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}