import { Link, Navigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import Figure from '@/components/ui/Figure'
import { PageContainer } from '@/components/layout/AppShell'
import { HOME_BY_ROLE } from '@/utils/constants'
import { IMAGES } from '@/utils/media'
import { useAuth } from '@/hooks/useAuth'

// Initialised UI components of landing pages
const STEPS = [
  {
    title: 'Quote it',
    body: 'Drop a pickup point and a destination. We price the run instantly from the routed distance and the weight tier.',
    image: IMAGES.scanningParcel,
  },
  {
    title: 'Track it',
    body: 'Every stage writes a tracking event. Follow your rider on the map from collection all the way to the doorstep.',
    image: IMAGES.riderOnRoad,
  },
  {
    title: 'Pay for it',
    body: 'Settle with M-Pesa straight from the order screen. The receipt lands in your inbox the moment it clears.',
    image: IMAGES.parcelHandoff,
  },
]

const TIERS = [
  { label: 'Light', max: '2 kg', copy: 'Documents, keys and small packets' },
  { label: 'Standard', max: '5 kg', copy: 'Shoeboxes, electronics, clothing' },
  { label: 'Heavy', max: '20 kg', copy: 'Appliances and bulk retail stock' },
  { label: 'Bulk', max: '50 kg', copy: 'Furniture and pallet loads' },
]

const PROOF = [
  { figure: '4', label: 'weight tiers', caption: 'priced from one transparent formula' },
  { figure: '3', label: 'roles', caption: 'customer, rider and operations' },
  { figure: '5', label: 'delivery stages', caption: 'every one logged and timestamped' },
]

export default function Landing() {
  const { isAuthenticated, role } = useAuth()

  if (isAuthenticated) {
    return <Navigate to={HOME_BY_ROLE[role] || '/dashboard'} replace />
  }

  return (
    <>
      <section className="relative isolate overflow-hidden bg-slate-950">
        <Figure
          src={IMAGES.heroRider}
          alt="A courier riding through the city with a delivery box"
          rounded=""
          eager
          fill
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/35"
          aria-hidden="true"
        />

        <PageContainer className="relative sm:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-0.5 font-body text-xs font-semibold uppercase tracking-[0.14em] text-brand-300 ring-1 ring-inset ring-white/15">
              Nairobi · same day
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Send a parcel across town without the phone tag.
            </h1>
            <p className="mt-6 max-w-prose font-body text-lg text-slate-200">
              Deliveroo turns a pickup point, a destination and a weight into a priced delivery you
              can watch move. Riders get a clear route. Operations get one board for every parcel in
              motion.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-2.5">
              <Button as={Link} to="/register" size="lg">
                Send your first parcel
              </Button>
              <Button
                as={Link}
                to="/services"
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/10 text-white ring-white/20 hover:bg-white/20"
              >
                See what we deliver
              </Button>
            </div>

            <dl className="mt-24 grid max-w-xl grid-cols-3 gap-3.5 border-t border-white/10 pt-6">
              {PROOF.map((item) => (
                <div key={item.label}>
                  <dt className="font-display text-3xl font-bold text-white">{item.figure}</dt>
                  <dd className="font-body text-sm font-semibold text-brand-300">{item.label}</dd>
                  <dd className="mt-0.5 font-body text-xs text-slate-400">{item.caption}</dd>
                </div>
              ))}
            </dl>
          </div>
        </PageContainer>
      </section>

      <PageContainer>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Figure
            src={IMAGES.sortingFacility}
            alt="Parcels being sorted at a logistics facility"
            className="aspect-[4/3] w-full"
            tone="brand"
          />
          <div>
            <p className="font-body text-xs uppercase tracking-[0.16em] text-brand-700">
              Why Deliveroo
            </p>
            <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-slate-950">
              A parcel should never go quiet
            </h2>
            <p className="mt-3.5 font-body text-lg text-slate-600">
              Most courier runs in Nairobi are coordinated over WhatsApp and phone calls. Nobody
              knows the real price until the rider arrives, and nobody knows where the parcel is
              until someone picks up.
            </p>
            <ul className="mt-6 flex flex-col gap-3.5">
              {[
                'The price is calculated before you commit, from distance and weight, with every line itemised.',
                'The status changes are written by the rider on the road, not guessed at by an office.',
                'Operations can see every unassigned parcel on one board and put a rider on it.',
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 font-body text-xs font-bold text-brand-800">
                    ✓
                  </span>
                  <span className="font-body text-base text-slate-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </PageContainer>

      <section className="bg-white py-8">
        <PageContainer className="py-0">
          <div className="max-w-prose">
            <p className="font-body text-xs uppercase tracking-[0.16em] text-brand-700">
              How it works
            </p>
            <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-slate-950">
              Three steps, start to doorstep
            </h2>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <article key={step.title} className="group flex flex-col">
                <Figure
                  src={step.image}
                  alt={step.title}
                  className="aspect-[5/4] w-full"
                  tone={index === 1 ? 'ember' : 'ink'}
                />
                <div className="mt-3.5 flex items-baseline gap-2.5">
                  <span className="font-mono text-sm text-brand-600">0{index + 1}</span>
                  <h3 className="font-display text-xl font-semibold text-slate-950">{step.title}</h3>
                </div>
                <p className="mt-1.5 font-body text-base text-slate-500">{step.body}</p>
              </article>
            ))}
          </div>
        </PageContainer>
      </section>

      <PageContainer>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="font-body text-xs uppercase tracking-[0.16em] text-brand-700">
              Pricing
            </p>
            <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-slate-950">
              Four weight tiers, one formula
            </h2>
            <p className="mt-3.5 font-body text-lg text-slate-600">
              A base fare plus distance, scaled by the handling multiplier for the tier, with a
              long-haul surcharge past 25 km. Nothing hidden, and you see the breakdown before you
              confirm.
            </p>
            <Button as={Link} to="/services" variant="dark" className="mt-6">
              Full pricing detail
            </Button>
          </div>

          <dl className="grid gap-2.5 sm:grid-cols-2">
            {TIERS.map((tier) => (
              <div
                key={tier.label}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100"
              >
                <div className="flex items-baseline justify-between gap-2.5">
                  <dt className="font-display text-xl font-semibold text-slate-950">
                    {tier.label}
                  </dt>
                  <span className="font-mono text-sm text-brand-700">{tier.max}</span>
                </div>
                <dd className="mt-1.5 font-body text-sm text-slate-500">{tier.copy}</dd>
              </div>
            ))}
          </dl>
        </div>
      </PageContainer>

      <section className="relative isolate overflow-hidden">
        <Figure src={IMAGES.nairobiStreet} alt="A Nairobi street scene" rounded="" fill />
        <div className="absolute inset-0 bg-slate-950/80" aria-hidden="true" />
        <PageContainer className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white">
              Ready to move something?
            </h2>
            <p className="mt-3.5 font-body text-lg text-slate-300">
              Create an account in under a minute. Riders can sign up here too.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <Button as={Link} to="/register" size="lg">
                Sign up
              </Button>
              <Button
                as={Link}
                to="/login"
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/10 text-white ring-white/20 hover:bg-white/20"
              >
                Sign in
              </Button>
            </div>
          </div>
        </PageContainer>
      </section>
    </>
  )
}