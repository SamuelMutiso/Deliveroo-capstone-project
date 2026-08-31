import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Star } from 'lucide-react'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { rateOrder, selectSaveError, selectSaving } from '@/features/orders/ordersSlice'
import { useToast } from '@/hooks/useToast'

const LABELS = ['', 'Poor', 'Not great', 'Fine', 'Good', 'Excellent']

export default function RateDelivery({ order }) {
  const dispatch = useDispatch()
  const toast = useToast()
  const saving = useSelector(selectSaving)
  const saveError = useSelector(selectSaveError)

  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')

  if (order.status !== 'delivered') return null

  if (order.rating) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100">
        <p className="font-body text-xs uppercase tracking-[0.14em] text-slate-400">
          Your rating
        </p>
        <div className="mt-2 flex items-center gap-2.5">
          <Stars value={order.rating} />
          <span className="font-body text-sm font-semibold text-slate-700">
            {LABELS[order.rating]}
          </span>
        </div>
        {order.rating_comment && (
          <p className="mt-2.5 font-body text-sm italic text-slate-600">
            “{order.rating_comment}”
          </p>
        )}
      </div>
    )
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!rating) return

    const result = await dispatch(rateOrder({ id: order.id, rating, comment }))
    if (rateOrder.fulfilled.match(result)) {
      toast.success('Thanks for rating this delivery')
    }
  }

  const shown = hovered || rating

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100"
    >
      <p className="font-display text-base font-bold text-slate-950">
        How was this delivery?
      </p>
      <p className="mt-0.5 font-body text-sm text-slate-500">
        {order.courier?.name
          ? `Rate ${order.courier.name}'s service.`
          : 'Rate the service you received.'}
      </p>

      <div
        className="mt-3.5 flex items-center gap-1.5"
        onMouseLeave={() => setHovered(0)}
        role="radiogroup"
        aria-label="Rating out of five"
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
            onMouseEnter={() => setHovered(value)}
            onFocus={() => setHovered(value)}
            onClick={() => setRating(value)}
            className="rounded-lg p-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            <Star
              className={[
                'h-7 w-7 transition',
                value <= shown ? 'fill-brand-400 text-brand-500' : 'text-slate-300',
              ].join(' ')}
              aria-hidden="true"
            />
          </button>
        ))}
        {shown > 0 && (
          <span className="ml-1.5 font-body text-sm font-semibold text-slate-600">
            {LABELS[shown]}
          </span>
        )}
      </div>

      <Input
        as="textarea"
        rows={3}
        label="Anything to add?"
        hint="Optional"
        className="mt-4"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="On time, parcel in good condition…"
        maxLength={400}
      />

      {saveError && <p className="mt-2.5 font-body text-sm text-red-700">{saveError}</p>}

      <div className="mt-4">
        <Button type="submit" disabled={!rating} loading={saving}>
          Submit rating
        </Button>
      </div>
    </form>
  )
}

function Stars({ value }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={[
            'h-5 w-5',
            star <= value ? 'fill-brand-400 text-brand-500' : 'text-slate-300',
          ].join(' ')}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}
