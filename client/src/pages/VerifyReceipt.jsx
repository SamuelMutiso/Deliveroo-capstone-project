import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BadgeCheck, ShieldAlert } from 'lucide-react'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { PageContainer, PageHeader } from '@/components/layout/AppShell'
import axiosClient from '@/api/axiosClient'
import { fullDate, money } from '@/utils/formatters'

export default function VerifyReceipt() {
  const [searchParams] = useSearchParams()
  const [reference, setReference] = useState(searchParams.get('ref') || '')
  const [result, setResult] = useState(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  const check = async (event) => {
    event.preventDefault()
    const value = reference.trim()
    if (!value || checking) return

    setChecking(true)
    setError('')
    setResult(null)

    try {
      const response = await axiosClient.get(`/orders/verify/${encodeURIComponent(value)}`)
      setResult(response.data)
    } catch {
      setError('We could not reach the server. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <PageContainer className="max-w-2xl">
      <PageHeader
        eyebrow="Receipt verification"
        title="Check a delivery receipt"
        description="Every Deliveroo receipt carries a document reference. Paste it here and we will confirm whether it came from us."
      />

      <form onSubmit={check} className="mt-6 flex flex-col gap-3.5 sm:flex-row sm:items-end">
        <Input
          label="Document reference"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="DLV-BS6EQE-4f9a2c71e08b"
          className="flex-1"
          required
        />
        <Button type="submit" size="lg" loading={checking}>
          {checking ? 'Checking…' : 'Verify'}
        </Button>
      </form>

      {error && <p className="mt-4 font-body text-sm text-red-700">{error}</p>}

      {result && result.valid && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-green-200 sm:p-8">
          <div className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 h-6 w-6 shrink-0 text-green-600" aria-hidden="true" />
            <div>
              <p className="font-display text-lg font-bold text-slate-950">
                This receipt is genuine
              </p>
              <p className="font-body text-sm text-slate-500">
                Issued by Deliveroo Logistics for a completed delivery.
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
            <Row label="Tracking code" value={result.receipt.tracking_code} mono />
            <Row label="Delivered" value={fullDate(result.receipt.delivered_at)} />
            <Row label="Received by" value={result.receipt.received_by} />
            <Row label="Delivered by" value={result.receipt.courier || 'Not recorded'} />
            <Row label="Amount" value={money(result.receipt.amount_kes)} />
            <Row
              label="Payment"
              value={result.receipt.payment_status === 'paid' ? 'Paid' : result.receipt.payment_status}
            />
          </dl>
        </section>
      )}

      {result && !result.valid && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-red-200 sm:p-8">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-600" aria-hidden="true" />
            <div>
              <p className="font-display text-lg font-bold text-slate-950">
                We cannot verify this reference
              </p>
              <p className="mt-1 font-body text-sm text-slate-600">
                {result.reason}. Check for a typo, or ask the sender to forward the original
                receipt email.
              </p>
            </div>
          </div>
        </section>
      )}
    </PageContainer>
  )
}

function Row({ label, value, mono }) {
  return (
    <div>
      <dt className="font-body text-xs uppercase tracking-[0.14em] text-slate-400">{label}</dt>
      <dd
        className={[
          'mt-0.5 text-slate-900',
          mono ? 'font-mono text-sm' : 'font-body text-sm font-semibold',
        ].join(' ')}
      >
        {value || '—'}
      </dd>
    </div>
  )
}
