import { PAYMENT_META, STATUS_META } from '@/utils/constants'

export default function StatusBadge({ status, size = 'md', showDot = true }) {
  const meta = STATUS_META[status] || {
    label: status,
    chip: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  }

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full font-body font-semibold',
        'ring-1 ring-inset whitespace-nowrap',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3.5 py-0.5 text-sm',
        meta.chip,
      ].join(' ')}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />}
      {meta.label}
    </span>
  )
}

export function PaymentBadge({ status = 'unpaid', size = 'md' }) {
  const meta = PAYMENT_META[status] || PAYMENT_META.unpaid

  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-body font-semibold ring-1 ring-inset',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3.5 py-0.5 text-sm',
        meta.chip,
      ].join(' ')}
    >
      {meta.label}
    </span>
  )
}
