import { Link } from 'react-router-dom'

import Button from '@/components/ui/Button'
import Figure from '@/components/ui/Figure'
import { PageContainer } from '@/components/layout/AppShell' 
import { CONTACT, mapsLink } from '@/utils/constants'
import { IMAGES } from '@/utils/media'

//Initialised components of the page
const VALUES = [
  {
    title: 'Price before promise',
    body: 'Nobody should agree to a delivery without knowing the cost. Every quote is itemised and calculated before you confirm.',
  },
  {
    title: 'The rider owns the update',
    body: 'Status changes are written by the person holding the parcel, on the road, not reconstructed later by an office.',
  },
  {
    title: 'Nothing gets lost quietly',
    body: 'Every assignment, stage change and location push is appended to a permanent timeline that the customer can read.',
  },
  {
    title: 'One board for operations',
    body: 'Unassigned parcels surface immediately so a rider can be put on them before the customer has to chase.',
  },
]

const ROLES = [
  {
    name: 'Customers',
    body: 'Businesses and individuals sending parcels across Nairobi. They book, watch and pay in one place.',
    image: IMAGES.boxesOnDoorstep,
  },
  {
    name: 'Riders',
    body: 'The couriers on the road. They see only their own runs, advance each stage, and share position as they go.',
    image: IMAGES.riderPortrait,
  },
  {
    name: 'Operations',
    body: 'The team assigning riders, correcting mistakes and watching network performance across every parcel.',
    image: IMAGES.teamPlanning,
  },
]

export default function About() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-slate-950">
        <Figure src={IMAGES.nairobiSkyline} alt="The Nairobi skyline" rounded="" eager fill />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 to-slate-950/45" aria-hidden="true" />
        <PageContainer className="relative">
          <div className="max-w-2xl">
            <p className="font-body text-xs uppercase tracking-[0.16em] text-brand-300">
              About us
            </p>
            <h1 className="mt-1.5 font-display text-4xl font-bold tracking-tight text-white">
              We built the courier tool we kept wishing existed.
            </h1>
            <p className="mt-6 font-body text-lg text-slate-200">
              Deliveroo is a parcel delivery management platform for Nairobi. It replaces the group
              chats, the guessed prices and the &ldquo;where is my parcel&rdquo; phone calls with one system that
              every side of a delivery can see.
            </p>
          </div>
        </PageContainer>
      </section>

      <PageContainer>
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="font-body text-xs uppercase tracking-[0.16em] text-brand-700">
              The problem
            </p>
            <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-slate-950">
              Coordination is the expensive part
            </h2>
            <div className="mt-3.5 flex flex-col gap-3.5 font-body text-base text-slate-600">
              <p>
                Moving a parcel across Nairobi is rarely hard. Knowing what it will cost, who is
                carrying it and whether it arrived is the hard part, and it is usually solved with a
                sequence of phone calls.
              </p>
              <p>
                That costs the sender time, the rider fuel spent on unclear instructions, and the
                dispatcher an afternoon of chasing. It also means disputes come down to whose memory
                of a WhatsApp thread is better.
              </p>
              <p>
                Deliveroo makes the delivery itself the record. The price is computed from the route,
                the stages are written as they happen, and the whole history sits on the order where
                anyone entitled to see it can read it.
              </p>
            </div>
          </div>
          <Figure
            src={IMAGES.teamPlanning}
            alt="Stacked parcels ready for dispatch"
            className="aspect-[4/5] w-full"
            tone="brand"
          />
        </div>
      </PageContainer>

      <section className="bg-white py-8">
        <PageContainer className="py-0">
          <div className="max-w-prose">
            <p className="font-body text-xs uppercase tracking-[0.16em] text-brand-700">
              What we believe
            </p>
            <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-slate-950">
              Four rules the product follows
            </h2>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {VALUES.map((value, index) => (
              <article
                key={value.title}
                className="rounded-2xl bg-slate-50/70 p-6 ring-1 ring-inset ring-slate-100"
              >
                <span className="font-mono text-sm text-brand-600">0{index + 1}</span>
                <h3 className="mt-2.5 font-display text-xl font-semibold text-slate-950">
                  {value.title}
                </h3>
                <p className="mt-1.5 font-body text-base text-slate-600">{value.body}</p>
              </article>
            ))}
          </div>
        </PageContainer>
      </section>

      <PageContainer>
        <div className="max-w-prose">
          <p className="font-body text-xs uppercase tracking-[0.16em] text-brand-700">
            Who uses it
          </p>
          <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-slate-950">
            Three roles, three different views
          </h2>
          <p className="mt-3.5 font-body text-lg text-slate-600">
            Everyone signs into the same platform and sees only what their job requires.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {ROLES.map((item, index) => (
            <article key={item.name} className="flex flex-col">
              <Figure
                src={item.image}
                alt={item.name}
                className="aspect-square w-full"
                tone={['cobalt', 'ember', 'brand'][index]}
              />
              <h3 className="mt-3.5 font-display text-xl font-semibold text-slate-950">
                {item.name}
              </h3>
              <p className="mt-1.5 font-body text-base text-slate-500">{item.body}</p>
            </article>
          ))}
        </div>

        <section className="mt-12">
          <p className="font-body text-xs uppercase tracking-[0.16em] text-brand-700">Find us</p>
          <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-slate-950">
            Come by, call, or email
          </h2>
          <p className="mt-3.5 max-w-prose font-body text-base text-slate-500">
            Tap any of these and your phone will do the right thing.
          </p>

          <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
            <ContactCard
              href={mapsLink(CONTACT.mapsQuery)}
              external
              label="Visit us"
              value={CONTACT.addressLines.join(', ')}
              action="Open in Google Maps"
              icon={
                <path
                  d="M12 2C7.9 2 4.5 5.3 4.5 9.4 4.5 15 12 22 12 22s7.5-7 7.5-12.6C19.5 5.3 16.1 2 12 2Zm0 10a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              }
            />
            <ContactCard
              href={`tel:${CONTACT.phoneDial}`}
              label="Call us"
              value={CONTACT.phoneDisplay}
              action="Open your dialler"
              icon={
                <path
                  d="M6.5 3h3l1.5 4-2 1.4a12 12 0 0 0 5.6 5.6l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              }
            />
            <ContactCard
              href={`mailto:${CONTACT.email}`}
              label="Email us"
              value={CONTACT.email}
              action="Open your mail app"
              icon={
                <>
                  <rect x="3" y="5.5" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="m3.6 7 8.4 5.6L20.4 7" stroke="currentColor" strokeWidth="1.5" />
                </>
              }
            />
          </div>

          <p className="mt-3.5 font-body text-sm text-slate-500">{CONTACT.hours}</p>
        </section>

        <div className="mt-12 rounded-2xl bg-slate-950 p-8 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white">
            Join as a customer or a rider
          </h2>
          <p className="mt-3.5 font-body text-lg text-slate-300">
            Both sign up from the same place. Operations accounts are provisioned internally.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <Button as={Link} to="/register" size="lg">
              Create an account
            </Button>
            <Button
              as={Link}
              to="/services"
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/10 text-white ring-white/20 hover:bg-white/20"
            >
              See our services
            </Button>
          </div>
        </div>
      </PageContainer>
    </>
  )
}

function ContactCard({ href, label, value, action, icon, external }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className="group flex flex-col gap-2.5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 transition hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-800">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          {icon}
        </svg>
      </span>
      <span>
        <span className="block font-body text-xs uppercase tracking-[0.12em] text-slate-400">
          {label}
        </span>
        <span className="mt-0.5 block font-display text-base font-semibold text-slate-950">
          {value}
        </span>
      </span>
      <span className="font-body text-sm text-brand-700 underline-offset-4 group-hover:underline">
        {action} →
      </span>
    </a>
  )
}