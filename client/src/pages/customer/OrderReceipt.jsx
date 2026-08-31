import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Printer } from 'lucide-react'

import Button from '@/components/ui/Button'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { PageContainer } from '@/components/layout/AppShell'
import { PageSpinner } from '@/components/ui/Spinner'
import {
  clearCurrent,
  fetchOrder,
  selectCurrentOrder,
  selectDetailError,
  selectDetailStatus,
} from '@/features/orders/ordersSlice'
import { fetchPayment, resetPayment, selectPayment } from '@/features/payments/paymentsSlice'
import { distance, fullDate, money } from '@/utils/formatters'
import { CONTACT } from '@/utils/constants'

export default function OrderReceipt() {
  const { id } = useParams()
  const dispatch = useDispatch()

  const order = useSelector(selectCurrentOrder)
  const status = useSelector(selectDetailStatus)
  const error = useSelector(selectDetailError)
  const payment = useSelector(selectPayment)

  useEffect(() => {
    dispatch(fetchOrder(id))
    dispatch(fetchPayment(id))
    return () => {
      dispatch(clearCurrent())
      dispatch(resetPayment())
    }
  }, [dispatch, id])

  if (status === 'loading' || status === 'idle') {
    return <PageSpinner label="Preparing the receipt" />
  }

  if (status === 'failed') {
    return (
      <PageContainer className="max-w-3xl">
        <ErrorMessage message={error} />
      </PageContainer>
    )
  }

  if (!order) return null

  const lines = order.price_breakdown?.lines || []

  return (
    <PageContainer className="max-w-3xl">
      <div className="flex items-center justify-between gap-3.5 print:hidden">
        <Link
          to={`/orders/${order.id}`}
          className="font-body text-sm font-semibold text-slate-500 underline-offset-4 hover:underline"
        >
          Back to the order
        </Link>
        <Button size="sm" variant="dark" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print or save as PDF
        </Button>
      </div>

      <article className="mt-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 print:mt-0 print:rounded-none print:p-0 print:shadow-none print:ring-0 sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <p className="font-body text-xs uppercase tracking-[0.16em] text-slate-400">
              {CONTACT.company}
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-950">
              Delivery receipt
            </h1>
            <p className="mt-1 font-mono text-sm text-slate-500">{order.tracking_code}</p>
          </div>
          <div className="text-right">
            <p className="font-body text-xs uppercase tracking-[0.14em] text-slate-400">Total</p>
            <p className="font-display text-3xl font-bold tracking-tight text-slate-950">
              {money(order.price_kes)}
            </p>
            <p className="font-body text-sm capitalize text-slate-500">
              {order.payment_status === 'paid' ? 'Paid' : order.payment_status}
            </p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-slate-100 py-6 sm:grid-cols-2">
          <Block label="Sender">
            <p className="font-body text-sm font-semibold text-slate-900">
              {order.customer?.name}
            </p>
            <p className="font-body text-sm text-slate-600">{order.customer?.phone}</p>
          </Block>
          <Block label="Recipient">
            <p className="font-body text-sm font-semibold text-slate-900">
              {order.recipient_name}
            </p>
            <p className="font-body text-sm text-slate-600">{order.recipient_phone}</p>
          </Block>
          <Block label="Collected from">
            <p className="font-body text-sm text-slate-700">{order.pickup_address}</p>
          </Block>
          <Block label="Delivered to">
            <p className="font-body text-sm text-slate-700">{order.destination_address}</p>
          </Block>
        </section>

        <section className="grid gap-6 border-b border-slate-100 py-6 sm:grid-cols-3">
          <Block label="Parcel">
            <p className="font-body text-sm text-slate-700">
              {order.weight_category} · {order.weight_kg} kg
            </p>
          </Block>
          <Block label="Distance">
            <p className="font-body text-sm text-slate-700">{distance(order.distance_km)}</p>
          </Block>
          <Block label="Rider">
            <p className="font-body text-sm text-slate-700">
              {order.courier?.name || 'Not assigned'}
            </p>
          </Block>
        </section>

        {lines.length > 0 && (
          <section className="border-b border-slate-100 py-6">
            <p className="font-body text-xs uppercase tracking-[0.14em] text-slate-400">
              Price breakdown
            </p>
            <dl className="mt-3.5 flex flex-col gap-2">
              {lines
                .filter((line) => line.amount !== 0)
                .map((line) => (
                  <div key={line.label} className="flex items-baseline justify-between gap-3.5">
                    <dt className="font-body text-sm text-slate-600">{line.label}</dt>
                    <dd className="font-mono text-sm text-slate-900">{money(line.amount)}</dd>
                  </div>
                ))}
              <div className="mt-1.5 flex items-baseline justify-between gap-3.5 border-t border-slate-100 pt-2.5">
                <dt className="font-body text-sm font-semibold text-slate-900">Total</dt>
                <dd className="font-mono text-sm font-semibold text-slate-900">
                  {money(order.price_kes)}
                </dd>
              </div>
            </dl>
          </section>
        )}

        <section className="grid gap-6 py-6 sm:grid-cols-2">
          <Block label="Ordered">
            <p className="font-body text-sm text-slate-700">{fullDate(order.created_at)}</p>
          </Block>
          {order.delivered_at && (
            <Block label="Delivered">
              <p className="font-body text-sm text-slate-700">{fullDate(order.delivered_at)}</p>
            </Block>
          )}
          {payment?.mpesa_receipt && (
            <Block label="M-Pesa receipt">
              <p className="font-mono text-sm text-slate-900">{payment.mpesa_receipt}</p>
            </Block>
          )}
          {payment?.phone && (
            <Block label="Paid from">
              <p className="font-body text-sm text-slate-700">{payment.phone}</p>
            </Block>
          )}
        </section>

        <footer className="border-t border-slate-100 pt-5">
          <p className="font-body text-xs leading-relaxed text-slate-500">
            {CONTACT.company} · {CONTACT.addressLines?.join(', ')}
          </p>
          <p className="mt-1 font-body text-xs text-slate-400">
            This receipt was generated from tracking reference {order.tracking_code}. Keep it for
            your records.
          </p>
        </footer>
      </article>
    </PageContainer>
  )
}

function Block({ label, children }) {
  return (
    <div>
      <p className="font-body text-xs uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  )
}
