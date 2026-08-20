import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

import Button from '@/components/ui/Button'
import Figure from '@/components/ui/Figure'
import { PageContainer } from '@/components/layout/AppShell'
import { IMAGES } from '@/utils/media'
import { ordersApi } from '@/api/ordersApi'
import { money } from '@/utils/formatters'

// Initialised fallback tiers incase of slow loading
const FALLBACK_TIERS = [
  { value: 'light', label: 'Light', description: 'Documents and small packets', max_kg: 2, multiplier: 1.0, handling_kes: 0 },
  { value: 'standard', label: 'Standard', description: 'Shoeboxes, electronics, clothing', max_kg: 5, multiplier: 1.35, handling_kes: 60 },
  { value: 'heavy', label: 'Heavy', description: 'Appliances and bulk retail', max_kg: 20, multiplier: 1.9, handling_kes: 180 },
  { value: 'bulk', label: 'Bulk', description: 'Furniture and pallet loads', max_kg: 50, multiplier: 2.6, handling_kes: 420 },
]

// Description of deliveroo features
const CAPABILITIES = [
  {
    title: 'Same-day city runs',
    body: 'Point-to-point delivery anywhere we cover, routed and priced the moment you enter both ends.',
    image: IMAGES.deliveryVan,
  },
  {
    title: 'Live parcel tracking',
    body: 'A map with your pickup, your destination and your rider, plus a timeline of every stage with timestamps.',
    image: IMAGES.riderOnRoad,
  },
  {
    title: 'M-Pesa checkout',
    body: 'Pay the exact quoted amount by STK push from the order screen. Receipts are emailed automatically.',
    image: IMAGES.scanningParcel,
  },
]

// Geographical scope of actice running areas
const COVERAGE = [
  'Westlands and Parklands',
  'Nairobi CBD',
  'Kilimani and Kileleshwa',
  'Karen and Langata',
  'Thika Road corridor',
  'Embakasi and JKIA',
  'Ruaka and Gigiri',
  'Ngong Road and Kikuyu',
]

// QnA
const FAQ = [
  {
    q: 'How is the price calculated?',
    a: 'A base fare, plus a per-kilometre rate over the routed distance, scaled by the handling multiplier for your weight tier, plus that tier’s handling fee. Runs over 25 km add a long-haul surcharge. The full breakdown is shown before you confirm.',
  },
  {
    q: 'Can I change the destination after booking?',
    a: 'Yes, while the order is still pending. The delivery is re-routed and re-priced automatically. Once a rider has collected the parcel the destination locks.',
  },
  {
    q: 'Can I cancel?',
    a: 'Any order that has not yet been delivered can be cancelled, and nothing further is charged.',
  },
  {
    q: 'How do I know where my parcel is?',
    a: 'The order page shows the rider’s last shared position on the map and a timeline of every status change, with who made it and when.',
  },
  {
    q: 'Do riders sign up here too?',
    a: 'Yes. Choose "I deliver parcels" on the sign-up form. Operations accounts are created internally, not through public sign-up.',
  },
]

export default function Services() {
  const [tiers, setTiers] = useState(FALLBACK_TIERS)

  useEffect(() => {
    let active = true
    ordersApi
      .categories()
      .then((data) => {
        if (active && data?.categories?.length) setTiers(data.categories)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <section className="relative isolate overflow-hidden bg-slate-950">
        <Figure src={IMAGES.parcelHandoff} alt="A parcel being handed to a customer" rounded="" eager fill />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 to-slate-950/45" aria-hidden="true" />
        <PageContainer className="relative">
          <div className="max-w-2xl">
            <p className="font-body text-xs uppercase tracking-[0.16em] text-brand-300">
              Services
            </p>
            <h1 className="mt-1.5 font-display text-4xl font-bold tracking-tight text-white">
              Everything we move, and what it costs.
            </h1>
            <p className="mt-6 font-body text-lg text-slate-200">
              From an envelope of documents to a pallet of stock. One pricing formula, four weight
              tiers, and a tracked delivery every time.
            </p>
          </div>
        </PageContainer>
      </section>

      <PageContainer>
        <div className="grid gap-6 md:grid-cols-3">
          {CAPABILITIES.map((item, index) => (
            <article key={item.title} className="flex flex-col">
              <Figure
                src={item.image}
                alt={item.title}
                className="aspect-[5/4] w-full"
                tone={['brand', 'ember', 'cobalt'][index]}
              />
              <h2 className="mt-3.5 font-display text-xl font-semibold text-slate-950">
                {item.title}
              </h2>
              <p className="mt-1.5 font-body text-base text-slate-500">{item.body}</p>
            </article>
          ))}
        </div>
      </PageContainer>

      <section className="bg-white py-8">
        <PageContainer className="py-0">
          <div className="max-w-prose">
            <p className="font-body text-xs uppercase tracking-[0.16em] text-brand-700">
              Weight tiers
            </p>
            <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-slate-950">
              Pick the tier that fits the parcel
            </h2>
            <p className="mt-3.5 font-body text-base text-slate-500">
              The multiplier scales the distance charge. The handling fee is flat. Both are shown on
              your quote before you confirm.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl ring-1 ring-inset ring-slate-100">
            <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50">
                  {['Tier', 'Up to', 'Multiplier', 'Handling', 'Typical parcel'].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-3.5 py-2.5 font-body text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 ${
                        h === 'Typical parcel' ? 'hidden md:table-cell' : ''
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => (
                  <tr key={tier.value} className="border-t border-slate-100 bg-white">
                    <td className="px-3.5 py-3.5 font-display text-base font-semibold text-slate-950">
                      {tier.label}
                    </td>
                    <td className="px-3.5 py-3.5 font-mono text-sm text-slate-700">
                      {tier.max_kg} kg
                    </td>
                    <td className="px-3.5 py-3.5 font-mono text-sm text-slate-700">
                      ×{tier.multiplier}
                    </td>
                    <td className="px-3.5 py-3.5 font-mono text-sm text-slate-700">
                      {tier.handling_kes ? money(tier.handling_kes) : '—'}
                    </td>
                    <td className="hidden px-3.5 py-3.5 font-body text-sm text-slate-500 md:table-cell">
                      {tier.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
            <div>
              <h3 className="font-display text-2xl font-semibold text-slate-950">
                A worked example
              </h3>
              <p className="mt-3.5 font-body text-base text-slate-600">
                Say you are sending a pair of shoes from Sarit Centre in Westlands to Karen
                Shopping Centre. That run is about 14 km, and shoes sit in the Standard band.
              </p>
              <p className="mt-3.5 font-body text-base text-slate-600">
                Every delivery starts with a flat base fare that covers the rider being
                dispatched. On top of that you pay for the distance actually travelled. Heavier
                bands cost more to carry, so a share is added on the distance charge, plus a fixed
                handling fee for the extra care. Runs over 25 km carry a long-haul surcharge, which
                this one does not.
              </p>
              <p className="mt-3.5 font-body text-base text-slate-600">
                You see this breakdown on screen before you confirm anything.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 ring-1 ring-inset ring-slate-200 sm:p-8">
              <p className="font-body text-xs uppercase tracking-[0.14em] text-slate-400">
                Westlands → Karen · 14.2 km · Standard
              </p>

              <dl className="mt-5 flex flex-col gap-3.5">
                {[
                  ['Base fare', 'Ksh 180', 'Dispatching a rider'],
                  ['Distance', 'Ksh 596', '14.2 km at Ksh 42 a kilometre'],
                  ['Standard band', 'Ksh 272', 'Added to the distance charge'],
                  ['Handling', 'Ksh 60', 'Flat fee for the band'],
                ].map(([label, amount, note]) => (
                  <div key={label} className="flex items-baseline justify-between gap-5">
                    <div>
                      <dt className="font-body text-base text-slate-800">{label}</dt>
                      <p className="font-body text-sm text-slate-400">{note}</p>
                    </div>
                    <dd className="shrink-0 font-mono text-base text-slate-700">{amount}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 flex items-baseline justify-between gap-5 border-t border-slate-200 pt-5">
                <span className="font-display text-lg font-semibold text-slate-950">
                  You pay
                </span>
                <span className="font-display text-2xl font-bold text-slate-950">Ksh 1,110</span>
              </div>
              <p className="mt-2.5 font-body text-xs text-slate-400">
                Rounded to the nearest ten shillings.
              </p>
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="font-body text-xs uppercase tracking-[0.16em] text-brand-700">
              Coverage
            </p>
            <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-slate-950">
              Where we ride
            </h2>
            <p className="mt-3.5 font-body text-base text-slate-500">
              Nairobi and the immediate metro. If both ends are on the map, we can quote it.
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {COVERAGE.map((area) => (
                <li key={area} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                  <span className="font-body text-base text-slate-700">{area}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-body text-xs uppercase tracking-[0.16em] text-brand-700">
              Questions
            </p>
            <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-slate-950">
              Before you book
            </h2>
            <dl className="mt-6 divide-y divide-slate-100 border-y border-slate-100">
              {FAQ.map((item) => (
                <div key={item.q} className="py-3.5">
                  <dt className="font-display text-base font-semibold text-slate-950">{item.q}</dt>
                  <dd className="mt-1.5 font-body text-base text-slate-600">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-3.5 rounded-2xl bg-brand-400 p-8 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-brand-950">
            Get a quote in about a minute
          </h2>
          <p className="max-w-prose font-body text-lg text-brand-900">
            Sign up, drop two pins and see the price before you commit to anything.
          </p>
          <Button as={Link} to="/register" size="lg" variant="dark">
            Sign up free
          </Button>
        </div>
      </PageContainer>
    </>
  )
}