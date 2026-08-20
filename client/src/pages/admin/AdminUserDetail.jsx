import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import ErrorMessage from '@/components/ui/ErrorMessage'
import StatusBadge from '@/components/ui/StatusBadge'
import { PageContainer, PageHeader } from '@/components/layout/AppShell'
import { PageSpinner } from '@/components/ui/Spinner'
import { adminApi } from '@/api/adminApi'
import { distance, fullDate, money, shortDate } from '@/utils/formatters'
import { extractError } from '@/utils/http'

const ROLE_LABEL = { customer: 'Customer', courier: 'Rider', admin: 'Operations' }

export default function AdminUserDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let live = true
    setData(null)
    setError(null)
    adminApi
      .user(id)
      .then((payload) => live && setData(payload))
      .catch((err) => live && setError(extractError(err, 'Could not load this account')))
    return () => {
      live = false
    }
  }, [id])

  if (error) {
    return (
      <PageContainer className="max-w-3xl">
        <ErrorMessage message={error} />
      </PageContainer>
    )
  }

  if (!data) return <PageSpinner label="Loading account" />

  const { user, activity, application, recent_orders: recent } = data
  const isCourier = user.role === 'courier'

  return (
    <PageContainer className="max-w-4xl">
      <Link
        to="/admin/users"
        className="-my-1.5 inline-block py-1.5 font-body text-sm text-slate-500 underline-offset-4 hover:underline"
      >
        ← People
      </Link>

      <PageHeader
        eyebrow={ROLE_LABEL[user.role] || user.role}
        title={user.name}
        description={user.is_active ? 'This account can sign in.' : 'This account is deactivated.'}
      />

      <div className="mt-6 flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 sm:flex-row sm:p-8">
        <Avatar name={user.name} photo={user.photo_url} size="xl" />

        <dl className="grid flex-1 gap-x-8 gap-y-3.5 sm:grid-cols-2">
          <Field label="Email" value={user.email} mono />
          {user.contact_email && <Field label="Personal email" value={user.contact_email} mono />}
          <Field label="Phone" value={user.phone} mono />
          <Field label="Role" value={ROLE_LABEL[user.role] || user.role} />
          <Field label="Account" value={user.is_active ? 'Active' : 'Deactivated'} />
          <Field label="Joined" value={fullDate(user.created_at)} />
          {isCourier && <Field label="Vehicle" value={user.vehicle} />}
          {isCourier && (
            <Field label="Duty" value={user.is_available ? 'On duty' : 'Off duty'} />
          )}
          {isCourier && user.last_seen_at && (
            <Field label="Last seen" value={fullDate(user.last_seen_at)} />
          )}
          {isCourier && user.current_lat != null && (
            <Field
              label="Last position"
              value={`${user.current_lat.toFixed(4)}, ${user.current_lng.toFixed(4)}`}
              mono
            />
          )}
        </dl>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Panel title="As a customer">
          <Row label="Orders placed" value={activity.placed} />
          <Row label="Delivered" value={activity.placed_by_status.delivered} />
          <Row label="Cancelled" value={activity.placed_by_status.cancelled} />
          <Row label="Spent on delivered runs" value={money(activity.spent_kes)} />
        </Panel>

        <Panel title="As a rider">
          <Row label="Deliveries assigned" value={activity.carried} />
          <Row label="Completed" value={activity.carried_by_status.delivered} />
          <Row label="Still open" value={activity.carried - activity.carried_by_status.delivered} />
          <Row label="Distance covered" value={distance(activity.distance_km)} />
        </Panel>
      </div>

      {application && (
        <Panel title="Rider application" className="mt-6">
          <Row label="Status" value={application.status} />
          <Row label="Licence" value={application.licence_number} />
          <Row label="Vehicle" value={application.vehicle_label} />
          <Row label="Applied" value={fullDate(application.created_at)} />
          {application.company_email && (
            <Row label="Rider sign-in" value={application.company_email} />
          )}
          {application.review_note && <Row label="Note" value={application.review_note} />}
        </Panel>
      )}

      <Panel title="Most recent orders" className="mt-6">
        {recent.length === 0 ? (
          <p className="font-body text-sm text-slate-500">Nothing on this account yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {recent.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3.5 py-3">
                <div>
                  <Link
                    to={`/admin/orders/${order.id}`}
                    className="font-mono text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
                  >
                    {order.tracking_code}
                  </Link>
                  <p className="font-body text-sm text-slate-500">
                    {order.pickup_address} → {order.destination_address}
                  </p>
                </div>
                <div className="flex items-center gap-3.5">
                  <span className="font-body text-xs text-slate-400">
                    {shortDate(order.created_at)}
                  </span>
                  <StatusBadge status={order.status} size="sm" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="mt-6">
        <Button as={Link} to="/admin/users" variant="outline">
          Back to people
        </Button>
      </div>
    </PageContainer>
  )
}

function Panel({ title, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 ${className}`}
    >
      <h2 className="font-display text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-3.5 flex flex-col gap-2.5">{children}</div>
    </section>
  )
}

function Field({ label, value, mono }) {
  return (
    <div>
      <dt className="font-body text-xs uppercase tracking-[0.12em] text-slate-400">{label}</dt>
      <dd
        className={`mt-0.5 break-all ${mono ? 'font-mono text-sm' : 'font-body text-base'} text-slate-800`}
      >
        {value || '—'}
      </dd>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3.5">
      <span className="font-body text-sm text-slate-500">{label}</span>
      <span className="font-body text-sm font-semibold capitalize text-slate-900">{value}</span>
    </div>
  )
}
