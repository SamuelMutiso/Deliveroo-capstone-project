import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Button from '@/components/ui/Button'
import PlaceField from '@/components/landing/PlaceField'
import { publicApi } from '@/api/publicApi'

export default function QuoteWidget() {
  const [pickup, setPickup] = useState(null)
  const [destination, setDestination] = useState(null)
  const [categories, setCategories] = useState([])
  const [category, setCategory] = useState('standard')
  const [result, setResult] = useState(null)
  const [pricing, setPricing] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let live = true
    publicApi
      .categories()
      .then((data) => {
        if (live) setCategories(data.categories || [])
      })
      .catch(() => setCategories([]))
    return () => {
      live = false
    }
  }, [])

  const ready = Boolean(pickup?.lat && destination?.lat)

  const getPrice = async () => {
    if (!ready) return
    setPricing(true)
    setError(null)
    setResult(null)

    try {
      const data = await publicApi.quote({
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        weight_category: category,
      })
      setResult(data)
    } catch (requestError) {
      setError(
        requestError?.response?.data?.error ||
          requestError?.response?.data?.message ||
          'Could not price that route. Try again in a moment.',
      )
    } finally {
      setPricing(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-inset ring-slate-100">
      <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
        <PlaceField
          label="Pickup"
          value={pickup}
          onChange={setPickup}
          placeholder="Kilimani"
        />
        <PlaceField
          label="Destination"
          value={destination}
          onChange={setDestination}
          placeholder="Westlands"
        />
      </div>

      {categories.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-700">
            Parcel size
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setCategory(item.value)
                  setResult(null)
                }}
                className={`rounded-full px-3.5 py-1.5 font-body text-sm transition ${
                  category === item.value
                    ? 'bg-slate-950 font-semibold text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
                <span className="ml-1.5 text-xs opacity-60">≤{item.max_kg}kg</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        {result ? (
          <div>
            <p className="font-body text-[10px] uppercase tracking-[0.14em] text-brand-700">
              Your price
            </p>
            <p className="mt-1 font-display text-3xl font-bold tracking-[-0.04em] text-slate-950">
              Ksh {result.quote.total.toLocaleString()}
            </p>
            <p className="mt-0.5 font-body text-sm text-slate-500">
              {result.route.distance_km} km · about {result.route.duration_min} min
            </p>
          </div>
        ) : (
          <p className="max-w-sm font-body text-sm text-slate-500">
            {error || 'Pick two points and we will price it before you sign up. No account needed.'}
          </p>
        )}

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="dark"
            className="rounded-full"
            loading={pricing}
            disabled={!ready}
            onClick={getPrice}
          >
            {result ? 'Price again' : 'Get the price'}
          </Button>
          {result && (
            <Button as={Link} to="/register" className="rounded-full">
              Send it
            </Button>
          )}
        </div>
      </div>

      {result && (
        <dl className="border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
          {result.quote.lines
            .filter((line) => line.amount > 0)
            .map((line) => (
              <div key={line.label} className="flex items-baseline justify-between py-0.5">
                <dt className="font-body text-sm text-slate-500">{line.label}</dt>
                <dd className="font-body text-sm text-slate-700">Ksh {line.amount}</dd>
              </div>
            ))}
        </dl>
      )}
    </div>
  )
}
