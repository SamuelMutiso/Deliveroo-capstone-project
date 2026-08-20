import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import ErrorMessage from '@/components/ui/ErrorMessage'
import MapView from '@/components/map/MapView'
import OrderForm from '@/components/orders/OrderForm'
import PriceBreakdown from '@/components/orders/PriceBreakdown'
import Spinner from '@/components/ui/Spinner'
import { PageContainer, PageHeader } from '@/components/layout/AppShell'
import {
  clearQuote,
  createOrder,
  fetchCategories,
  fetchQuote,
  selectCategories,
  selectQuote,
  selectQuoteError,
  selectQuoteStatus,
  selectSaveError,
  selectSaving,
} from '@/features/orders/ordersSlice'
import { isEmpty, validateOrder } from '@/utils/validators'
import { useToast } from '@/hooks/useToast'

const BLANK = {
  pickup: null,
  destination: null,
  weight_category: 'standard',
  recipient_name: '',
  recipient_phone: '',
  recipient_email: '',
  notes: '',
}

export default function NewOrder() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()

  const categories = useSelector(selectCategories)
  const quote = useSelector(selectQuote)
  const quoteStatus = useSelector(selectQuoteStatus)
  const quoteError = useSelector(selectQuoteError)
  const saving = useSelector(selectSaving)
  const saveError = useSelector(selectSaveError)

  const [values, setValues] = useState(BLANK)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    dispatch(fetchCategories())
    return () => {
      dispatch(clearQuote())
    }
  }, [dispatch])

  const quotePayload = useMemo(() => {
    const { pickup, destination, weight_category: category } = values
    if (!pickup?.lat || !destination?.lat || !category) return null
    return {
      pickup_lat: pickup.lat,
      pickup_lng: pickup.lng,
      destination_lat: destination.lat,
      destination_lng: destination.lng,
      weight_category: category,
    }
  }, [values])

  const routeReady = Boolean(quotePayload)

  useEffect(() => {
    if (!quotePayload) {
      dispatch(clearQuote())
      return undefined
    }
    const timer = window.setTimeout(() => dispatch(fetchQuote(quotePayload)), 450)
    return () => window.clearTimeout(timer)
  }, [quotePayload, dispatch])

  const canSubmit = useMemo(
    () => isEmpty(validateOrder(values)) && Boolean(quote),
    [values, quote],
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = validateOrder(values)
    setErrors(found)
    if (!isEmpty(found)) return

    const result = await dispatch(
      createOrder({
        pickup_address: values.pickup.address,
        pickup_lat: values.pickup.lat,
        pickup_lng: values.pickup.lng,
        destination_address: values.destination.address,
        destination_lat: values.destination.lat,
        destination_lng: values.destination.lng,
        weight_category: values.weight_category,
        recipient_name: values.recipient_name.trim(),
        recipient_phone: values.recipient_phone.trim(),
        recipient_email: values.recipient_email.trim() || null,
        notes: values.notes.trim() || null,
      }),
    )

    if (createOrder.fulfilled.match(result)) {
      toast.success(`Order ${result.payload.tracking_code} created`)
      navigate(`/orders/${result.payload.id}`)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="New delivery"
        title="Send a parcel"
        description="Pick the two points, tell us what is inside, and we price the run before you commit."
      />

      <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 sm:p-8">
          <OrderForm
            values={values}
            errors={errors}
            categories={categories}
            onChange={setValues}
          />
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-[5.5rem] lg:self-start">
          <MapView
            pickup={values.pickup}
            destination={values.destination}
            polyline={quote?.route?.polyline}
            height="h-[16rem]"
          />

          {quoteStatus === 'loading' && (
            <div className="flex items-center justify-center rounded-2xl bg-white p-6 ring-1 ring-inset ring-slate-100">
              <Spinner label="Pricing your route" />
            </div>
          )}

          {quoteStatus === 'failed' && <ErrorMessage compact message={quoteError} />}

          {quoteStatus === 'ready' && quote && (
            <PriceBreakdown quote={quote.quote} route={quote.route} />
          )}

          {!routeReady && quoteStatus !== 'loading' && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6">
              <p className="font-body text-sm text-slate-500">
                Choose a pickup point and a destination to see the price.
              </p>
            </div>
          )}

          {saveError && <ErrorMessage compact message={saveError} />}

          <Button type="submit" size="lg" fullWidth loading={saving} disabled={!canSubmit}>
            Confirm and book
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}