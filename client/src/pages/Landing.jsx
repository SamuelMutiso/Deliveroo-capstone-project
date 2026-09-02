import { Link, Navigate } from 'react-router-dom'
import { motion, useAnimationControls } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import Button from '@/components/ui/Button'
import Figure from '@/components/ui/Figure'
import { PageContainer } from '@/components/layout/AppShell'
import { HOME_BY_ROLE } from '@/utils/constants'
import { IMAGES } from '@/utils/media'
import { useAuth } from '@/hooks/useAuth'

const ease = [0.22, 1, 0.36, 1]

function Truck({ className = '' }) {
  return (
    <svg viewBox="0 0 240 100" className={className} fill="none" aria-hidden="true">
      <rect x="12" y="18" width="135" height="54" rx="5" fill="currentColor" />
      <path d="M147 40H184L211 61V72H147V40Z" fill="currentColor" />
      <path d="M125 19V71" stroke="currentColor" strokeWidth="2" opacity=".2" />
      <path d="M171 44H183L198 58H171V44Z" fill="black" opacity=".55" />
      <rect x="207" y="64" width="20" height="8" rx="3" fill="currentColor" />
      <circle cx="55" cy="76" r="14" fill="currentColor" />
      <circle cx="55" cy="76" r="6" fill="black" />
      <circle cx="181" cy="76" r="14" fill="currentColor" />
      <circle cx="181" cy="76" r="6" fill="black" />
      <rect x="35" y="31" width="35" height="27" rx="3" fill="black" opacity=".85" />
      <path d="M35 38L52.5 47L70 38" stroke="currentColor" strokeWidth="2" />
      <path d="M52.5 47V58" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function Reveal({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function HeroJourney() {
  const controls = useAnimationControls()
  const [pickup, setPickup] = useState(false)
  const [beep, setBeep] = useState(false)

  useEffect(() => {
    let cancelled = false
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

    async function runJourney() {
      await controls.start({ left: '0%', x: '0%', transition: { duration: 0 } })
      if (cancelled) return

      await controls.start({
        left: '50%',
        x: '-50%',
        transition: { duration: 2.25, ease: [0.45, 0, 0.55, 1] },
      })
      if (cancelled) return

      await wait(400)
      if (cancelled) return

      setPickup(true)
      await wait(350)
      if (cancelled) return

      await controls.start({
        left: '100%',
        x: '-100%',
        transition: { duration: 2.25, ease: [0.45, 0, 0.55, 1] },
      })
      if (cancelled) return

      await wait(250)
      if (cancelled) return

      setBeep(true)
    }

    runJourney()
    return () => {
      cancelled = true
    }
  }, [controls])

  return (
    <div className="relative h-[100px] w-full overflow-hidden sm:h-[115px]">
      <div className="absolute bottom-[27px] left-0 right-0 border-t border-white/15" />

      <div className="absolute bottom-[23px] right-[7%] h-2 w-2 rounded-full bg-white/25" />

      <motion.div
        initial={{ opacity: 1, scale: 1, y: 0 }}
        animate={pickup ? { opacity: 0, scale: 0.65, y: 5 } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeIn' }}
        className="absolute bottom-[35px] left-1/2 z-10 -translate-x-1/2"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-white bg-black sm:h-10 sm:w-10">
          <div className="h-[18px] w-[18px] border-2 border-white">
            <div className="mx-auto mt-[4px] h-px w-3 bg-white" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={pickup ? { opacity: [0, 0.5, 0], scale: [0.6, 1, 1.35] } : { opacity: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="absolute bottom-[31px] left-1/2 z-0 h-12 w-12 -translate-x-1/2 rounded-full border border-white/40"
      />

      <motion.div
        initial={{ left: '0%', x: '0%' }}
        animate={controls}
        className="absolute bottom-0 z-20 w-[108px] text-white sm:w-[125px]"
      >
        <Truck className="w-full" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 3 }}
        animate={beep ? { opacity: [0, 1, 1, 0], y: [3, 0, 0, -2] } : { opacity: 0 }}
        transition={{ duration: 1.2, times: [0, 0.12, 0.7, 1], ease: 'easeOut' }}
        className="absolute bottom-[66px] right-[4%] font-body text-[9px] font-bold uppercase tracking-[0.16em] text-white"
      >
        beep beep
      </motion.div>
    </div>
  )
}

const DELIVERY_PATH = `
  M 35 142
  C 130 142 145 48 285 45
  C 415 42 405 132 535 134
  C 665 136 680 48 865 38
`

function svgPointToPercent(point) {
  return { x: (point.x / 900) * 100, y: (point.y / 180) * 100 }
}

function CurvedRouteTruck({ active, pathRef }) {
  const frameRef = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0, angle: 0, visible: false })

  useEffect(() => {
    if (!active || !pathRef?.current) return

    const path = pathRef.current
    const totalLength = path.getTotalLength()
    const duration = 4300
    const startTime = performance.now()

    const animate = (now) => {
      const elapsed = now - startTime
      const rawProgress = Math.min(elapsed / duration, 1)
      const progress =
        rawProgress < 0.5
          ? 2 * rawProgress * rawProgress
          : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2

      const distance = progress * totalLength
      const point = path.getPointAtLength(distance)
      const nextPoint = path.getPointAtLength(Math.min(distance + 1.5, totalLength))
      const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI)
      const percent = svgPointToPercent(point)

      setPosition({ x: percent.x, y: percent.y, angle, visible: true })

      if (rawProgress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [active, pathRef])

  return (
    <div
      className="pointer-events-none absolute z-20 w-[68px] sm:w-[92px]"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        opacity: position.visible ? 1 : 0,
        transform: `translate(-50%, -50%) rotate(${position.angle}deg)`,
        transition: 'opacity 180ms ease',
      }}
    >
      <Truck className="w-full text-slate-950" />
    </div>
  )
}

function RouteSection() {
  const sectionRef = useRef(null)
  const pathRef = useRef(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const element = sectionRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} id="route" className="bg-brand-50 py-20 sm:py-28">
      <PageContainer>
        <div className="flex items-end justify-between gap-5">
          <Reveal>
            <p className="font-body text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-700">
               Move
            </p>
            <h2 className="mt-2 font-display text-[2.35rem] font-bold leading-[.9] tracking-[-0.055em] text-slate-950 sm:text-6xl">
              From here
              <br />
              to there.
            </h2>
          </Reveal>

          <Reveal delay={0.08} className="hidden max-w-[190px] sm:block">
            <p className="font-body text-sm leading-5 text-slate-500">
              Your customer follows the delivery in real time.
            </p>
          </Reveal>
        </div>

        <Reveal className="mt-10 sm:mt-14">
          <div className="relative h-[145px] w-full sm:h-[175px]">
            <svg
              viewBox="0 0 900 180"
              className="absolute inset-0 h-full w-full overflow-visible"
              fill="none"
              preserveAspectRatio="none"
            >
              <path ref={pathRef} d={DELIVERY_PATH} stroke="transparent" strokeWidth="1" fill="none" />

              <motion.path
                d={DELIVERY_PATH}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: active ? 1 : 0 }}
                transition={{ duration: 1.3, ease: 'easeInOut' }}
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="5 9"
                strokeLinecap="round"
                className="text-slate-950/30"
              />

              <circle cx="35" cy="142" r="4" fill="currentColor" className="text-brand-700" />
              <circle cx="865" cy="38" r="4" fill="currentColor" className="text-brand-700" />
            </svg>

            <CurvedRouteTruck active={active} pathRef={pathRef} />

            <div className="absolute bottom-0 left-0">
              <p className="font-body text-[9px] font-bold uppercase tracking-[0.14em] text-slate-950">
                Kilimani
              </p>
            </div>

            <div className="absolute right-0 top-0">
              <p className="font-body text-[9px] font-bold uppercase tracking-[0.14em] text-slate-950">
                Westlands
              </p>
            </div>
          </div>
        </Reveal>
      </PageContainer>
    </section>
  )
}

const STATUSES = ['Order placed', 'Courier assigned', 'Picked up', 'In transit', 'Delivered']

function TrackingSection() {
  return (
    <section id="tracking" className="bg-slate-950 py-20 text-white sm:py-28">
      <PageContainer>
        <div className="grid gap-6 sm:grid-cols-[.8fr_1.2fr] sm:items-end sm:gap-12">
          <Reveal>
            <p className="font-body text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-300">
              Track
            </p>
            <h2 className="mt-2 font-display text-[2.35rem] font-bold leading-[.9] tracking-[-0.055em] sm:text-6xl">
              Always know
              <br />
              where it is.
            </h2>
          </Reveal>

          <Reveal>
            <div className="border-t border-white/15">
              {STATUSES.map((status, index) => (
                <div
                  key={status}
                  className="flex items-center justify-between border-b border-white/15 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        index < 4 ? 'bg-brand-300' : 'bg-white/20'
                      }`}
                    />
                    <span className={`font-body text-sm ${index < 4 ? 'text-white' : 'text-white/30'}`}>
                      {status}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-white/20">0{index + 1}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </PageContainer>
    </section>
  )
}

const WORK_STEPS = [
  {
    number: '01',
    title: 'Choose your route.',
    text: 'Pickup and destination.',
    image: IMAGES.riderOnRoad,
    tone: 'ink',
  },
  {
    number: '02',
    title: 'Choose your parcel.',
    text: 'Weight sets the price.',
    image: IMAGES.scanningParcel,
    tone: 'ember',
  },
  {
    number: '03',
    title: 'Let it move.',
    text: 'Track it until it arrives.',
    image: IMAGES.parcelHandoff,
    tone: 'brand',
  },
]

export default function Landing() {
  const { isAuthenticated, role } = useAuth()

  if (isAuthenticated) {
    return <Navigate to={HOME_BY_ROLE[role] || '/dashboard'} replace />
  }

  return (
    <main className="overflow-hidden bg-white text-slate-950">
      <header className="absolute inset-x-0 top-0 z-50">
        <PageContainer className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Deliveroo home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-400 shadow-inner">
              <svg viewBox="0 0 32 32" className="h-5 w-5 text-brand-950" fill="none" aria-hidden="true">
                <path d="M8 21 14 9l4 7.5L20 13l4 8z" fill="currentColor" />
              </svg>
            </span>
            <span className="font-display text-2xl font-bold tracking-[-0.06em] text-white">
              Deliveroo
            </span>
          </Link>

          <nav className="hidden items-center rounded-full bg-white/90 px-1.5 py-1.5 shadow-sm ring-1 ring-black/5 backdrop-blur md:flex">
            <a href="#route" className="px-4 py-1.5 font-body text-sm font-medium">
              Route
            </a>
            <a href="#tracking" className="px-4 py-1.5 font-body text-sm font-medium">
              Tracking
            </a>
            <a href="#how" className="px-4 py-1.5 font-body text-sm font-medium">
              How it works
            </a>
            <Link to="/about" className="px-4 py-1.5 font-body text-sm font-medium">
              About us
            </Link>
            <Link to="/services" className="px-4 py-1.5 font-body text-sm font-medium">
              Services
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button as={Link} to="/login" variant="dark" className="rounded-full px-5 py-2 text-sm">
              Sign in
            </Button>
            <Button as={Link} to="/register" variant="dark" className="rounded-full px-5 py-2 text-sm">
              Sign up
            </Button>
          </div>
        </PageContainer>
      </header>

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

        <PageContainer className="relative flex min-h-[100svh] flex-col justify-center pb-20 pt-28 sm:pt-32">
          <Reveal>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-0.5 font-body text-xs font-semibold uppercase tracking-[0.14em] text-brand-300 ring-1 ring-inset ring-white/15">
              Nairobi · parcel delivery
            </span>
          </Reveal>

          <motion.h1
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease }}
            className="mt-4 font-display text-7xl font-extrabold leading-[.85] tracking-[-0.06em] text-white sm:text-8xl lg:text-9xl"
          >
            Deliveroo
          </motion.h1>

          <Reveal delay={0.08} className="mt-5 max-w-md">
            <p className="font-body text-base leading-6 text-slate-200 sm:text-lg">
              Send something across Nairobi.
              <br />
              Watch it make its way there.
            </p>
          </Reveal>

          <Reveal delay={0.14} className="mt-6 flex flex-wrap items-center gap-2.5">
            <Button as={Link} to="/register" size="lg">
              Start delivery
            </Button>
            <Button
              as="a"
              href="#how"
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/10 text-white ring-white/20 hover:bg-white/20"
            >
              How it works
            </Button>
          </Reveal>

          <Reveal delay={0.2} className="mt-10 max-w-md">
            <HeroJourney />
          </Reveal>
        </PageContainer>
      </section>

      <section id="how" className="bg-white py-20 sm:py-28">
        <PageContainer>
          <Reveal>
            <p className="font-body text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-700">
               Send
            </p>
            <h2 className="mt-2 font-display text-[2.35rem] font-bold leading-[.9] tracking-[-0.055em] sm:text-6xl">
              Tell us where
              <br />
              it needs to go.
            </h2>
          </Reveal>

          <Reveal className="mt-10">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-inset ring-slate-100">
              <div className="grid sm:grid-cols-2">
                <div className="border-b border-slate-100 p-4 sm:border-b-0 sm:border-r sm:p-5">
                  <p className="font-body text-[9px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                    Pickup
                  </p>
                  <p className="mt-1.5 font-display text-lg font-semibold tracking-[-0.03em]">
                    Kilimani
                  </p>
                  <p className="mt-0.5 font-body text-xs text-slate-400">Nairobi, Kenya</p>
                </div>

                <div className="p-4 sm:p-5">
                  <p className="font-body text-[9px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                    Destination
                  </p>
                  <p className="mt-1.5 font-display text-lg font-semibold tracking-[-0.03em]">
                    Westlands
                  </p>
                  <p className="mt-0.5 font-body text-xs text-slate-400">Nairobi, Kenya</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <p className="font-body text-[9px] uppercase tracking-[0.14em] text-brand-700">
                    Estimated
                  </p>
                  <p className="mt-1 font-display text-base font-semibold">8.4 km · ~24 min</p>
                </div>

                <Button as={Link} to="/register" variant="dark" className="w-full rounded-full sm:w-auto">
                  Start delivery
                </Button>
              </div>
            </div>
          </Reveal>
        </PageContainer>
      </section>

      <RouteSection />

      <TrackingSection />

      <section className="bg-white py-20 sm:py-28">
        <PageContainer>
          <Reveal>
            <p className="font-body text-xs uppercase tracking-[0.16em] text-brand-700">
              How it works
            </p>
            <h2 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Three steps.
              <br />
              That’s it.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {WORK_STEPS.map((step, index) => (
              <Reveal key={step.number} delay={index * 0.05}>
                <article className="flex flex-col">
                  <Figure
                    src={step.image}
                    alt={step.title}
                    className="aspect-[5/4] w-full"
                    tone={step.tone}
                  />
                  <div className="mt-3.5 flex items-baseline gap-2.5">
                    <span className="font-mono text-sm text-brand-600">{step.number}</span>
                    <h3 className="font-display text-xl font-semibold text-slate-950">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-1.5 font-body text-base text-slate-500">{step.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="relative isolate overflow-hidden">
        <Figure src={IMAGES.nairobiStreet} alt="A Nairobi street scene" rounded="" fill />
        <div className="absolute inset-0 bg-slate-950/80" aria-hidden="true" />

        <PageContainer className="relative py-24 sm:py-32">
          <Reveal className="text-center">
            <p className="font-body text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-300">
              Ready?
            </p>
            <h2 className="mt-2 font-display text-6xl font-extrabold leading-[.8] tracking-[-0.065em] text-white sm:text-8xl">
              Send it.
            </h2>
            <p className="mx-auto mt-3 max-w-xs font-body text-sm leading-5 text-slate-300">
              Give it a destination.
              <br />
              We’ll take care of the journey.
            </p>

            <div className="mt-6">
              <Button as={Link} to="/register" size="lg" className="rounded-full px-8">
                Start a delivery
              </Button>
            </div>
          </Reveal>
        </PageContainer>
      </section>

      <footer className="bg-slate-950 py-10 text-white">
        <PageContainer className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <Link to="/" className="font-display text-xl font-bold tracking-[-0.05em]">
            Deliveroo
          </Link>
          <nav className="flex items-center gap-5">
            <Link to="/about" className="py-1.5 font-body text-xs text-white/60 transition hover:text-white">
              About us
            </Link>
            <Link to="/services" className="py-1.5 font-body text-xs text-white/60 transition hover:text-white">
              Services
            </Link>
            <Link to="/terms" className="py-1.5 font-body text-xs text-white/60 transition hover:text-white">
              Terms
            </Link>
            <Link to="/privacy" className="py-1.5 font-body text-xs text-white/60 transition hover:text-white">
              Privacy
            </Link>
            <Link to="/login" className="py-1.5 font-body text-xs text-white/60 transition hover:text-white">
              Sign in
            </Link>
          </nav>
          <p className="font-body text-[9px] text-white/30">Nairobi · parcel delivery</p>
        </PageContainer>
      </footer>
    </main>
  )
}
