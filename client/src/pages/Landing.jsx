import { Link, Navigate } from "react-router-dom";
import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import Button from "@/components/ui/Button";
import { PageContainer } from "@/components/layout/AppShell";
import { HOME_BY_ROLE } from "@/utils/constants";
import { useAuth } from "@/hooks/useAuth";

const ease = [0.22, 1, 0.36, 1];

/* -------------------------------------------------------------------------- */
/* TRUCK                                                                       */
/* -------------------------------------------------------------------------- */

function Truck({ className = "" }) {
  return (
    <svg
      viewBox="0 0 240 100"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <rect x="12" y="18" width="135" height="54" rx="5" fill="currentColor" />

      <path d="M147 40H184L211 61V72H147V40Z" fill="currentColor" />

      <path d="M125 19V71" stroke="white" strokeWidth="2" opacity=".15" />

      <path d="M171 44H183L198 58H171V44Z" fill="white" opacity=".75" />

      <rect x="207" y="64" width="20" height="8" rx="3" fill="currentColor" />

      <circle cx="55" cy="76" r="14" fill="currentColor" />

      <circle cx="55" cy="76" r="6" fill="white" />

      <circle cx="181" cy="76" r="14" fill="currentColor" />

      <circle cx="181" cy="76" r="6" fill="white" />

      {/* parcel inside truck */}
      <rect
        x="35"
        y="31"
        width="35"
        height="27"
        rx="3"
        fill="white"
        opacity=".9"
      />

      <path d="M35 38L52.5 47L70 38" stroke="currentColor" strokeWidth="2" />

      <path d="M52.5 47V58" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* REVEAL                                                                      */
/* -------------------------------------------------------------------------- */

function Reveal({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        margin: "-50px",
      }}
      transition={{
        duration: 0.5,
        delay,
        ease,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* HERO JOURNEY                                                                */
/* -------------------------------------------------------------------------- */

function HeroJourney() {
  const controls = useAnimationControls();

  const [pickup, setPickup] = useState(false);
  const [beep, setBeep] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const wait = (ms) =>
      new Promise((resolve) => {
        setTimeout(resolve, ms);
      });

    async function runJourney() {
      /*
       * ---------------------------------------------------------------
       * START
       * ---------------------------------------------------------------
       *
       * Truck is completely inside the left edge.
       */
      await controls.start({
        left: "0%",
        x: "0%",
        transition: {
          duration: 0,
        },
      });

      if (cancelled) return;

      /*
       * ---------------------------------------------------------------
       * DRIVE TO PARCEL
       * ---------------------------------------------------------------
       *
       * left: 50%
       * x: -50%
       *
       * This puts the CENTER of the truck exactly at the center
       * of the animation container, where the parcel is.
       */
      await controls.start({
        left: "50%",
        x: "-50%",
        transition: {
          duration: 2.25,
          ease: [0.45, 0, 0.55, 1],
        },
      });

      if (cancelled) return;

      /*
       * ---------------------------------------------------------------
       * STOP
       * ---------------------------------------------------------------
       */
      await wait(400);

      if (cancelled) return;

      /*
       * ---------------------------------------------------------------
       * PICK UP PARCEL
       * ---------------------------------------------------------------
       */
      setPickup(true);

      await wait(350);

      if (cancelled) return;

      /*
       * ---------------------------------------------------------------
       * DRIVE TO DESTINATION
       * ---------------------------------------------------------------
       *
       * left: 100%
       * x: -100%
       *
       * The right edge of the truck reaches the right edge
       * of the animation container.
       *
       * The truck therefore stays fully visible.
       */
      await controls.start({
        left: "100%",
        x: "-100%",
        transition: {
          duration: 2.25,
          ease: [0.45, 0, 0.55, 1],
        },
      });

      if (cancelled) return;

      /*
       * ---------------------------------------------------------------
       * ARRIVAL PAUSE
       * ---------------------------------------------------------------
       */
      await wait(250);

      if (cancelled) return;

      /*
       * ---------------------------------------------------------------
       * BEEP BEEP
       * ---------------------------------------------------------------
       */
      setBeep(true);
    }

    runJourney();

    return () => {
      cancelled = true;
    };
  }, [controls]);

  return (
    <div className="relative mt-7 h-[110px] w-full overflow-hidden sm:mt-9 sm:h-[125px]">
      {/* ROAD */}
      <div className="absolute bottom-[27px] left-0 right-0 border-t border-slate-950/15" />

      {/* DESTINATION MARKER */}
      <div className="absolute bottom-[23px] right-[7%] h-2 w-2 rounded-full bg-slate-950/25" />

      {/* PARCEL */}
      <motion.div
        initial={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        animate={
          pickup
            ? {
                opacity: 0,
                scale: 0.65,
                y: 5,
              }
            : {
                opacity: 1,
                scale: 1,
                y: 0,
              }
        }
        transition={{
          duration: 0.22,
          ease: "easeIn",
        }}
        className="absolute bottom-[35px] left-1/2 z-10 -translate-x-1/2"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-slate-950 bg-white sm:h-10 sm:w-10">
          <div className="h-[18px] w-[18px] border-2 border-slate-950">
            <div className="mx-auto mt-[4px] h-px w-3 bg-slate-950" />
          </div>
        </div>
      </motion.div>

      {/* PICKUP PULSE */}
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.6,
        }}
        animate={
          pickup
            ? {
                opacity: [0, 0.5, 0],
                scale: [0.6, 1, 1.35],
              }
            : {
                opacity: 0,
              }
        }
        transition={{
          duration: 0.7,
          ease: "easeOut",
        }}
        className="absolute bottom-[31px] left-1/2 z-0 h-12 w-12 -translate-x-1/2 rounded-full border border-slate-950/20"
      />

      {/* TRUCK */}
      <motion.div
        initial={{
          left: "0%",
          x: "0%",
        }}
        animate={controls}
        className="absolute bottom-0 z-20 w-[116px] text-slate-950 sm:w-[135px]"
      >
        <Truck className="w-full" />
      </motion.div>

      {/* BEEP */}
      <motion.div
        initial={{
          opacity: 0,
          y: 3,
        }}
        animate={
          beep
            ? {
                opacity: [0, 1, 1, 0],
                y: [3, 0, 0, -2],
              }
            : {
                opacity: 0,
              }
        }
        transition={{
          duration: 1.2,
          times: [0, 0.12, 0.7, 1],
          ease: "easeOut",
        }}
        className="absolute bottom-[74px] right-[4%] font-body text-[9px] font-bold uppercase tracking-[0.16em]"
      >
        beep beep
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CURVED DELIVERY PATH                                                        */
/* -------------------------------------------------------------------------- */

const DELIVERY_PATH = `
  M 35 142
  C 130 142 145 48 285 45
  C 415 42 405 132 535 134
  C 665 136 680 48 865 38
`;

function svgPointToPercent(point) {
  return {
    x: (point.x / 900) * 100,
    y: (point.y / 180) * 100,
  };
}

/* -------------------------------------------------------------------------- */
/* CURVED ROUTE TRUCK                                                          */
/* -------------------------------------------------------------------------- */

function CurvedRouteTruck({ active, pathRef }) {
  const frameRef = useRef(null);

  const [position, setPosition] = useState({
    x: 0,
    y: 0,
    angle: 0,
    visible: false,
  });

  useEffect(() => {
    if (!active || !pathRef?.current) {
      return;
    }

    const path = pathRef.current;
    const totalLength = path.getTotalLength();

    const duration = 4300;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;

      const rawProgress = Math.min(elapsed / duration, 1);

      /*
       * Smooth movement along the ACTUAL SVG path.
       *
       * We never calculate x/y manually.
       * getPointAtLength() gives us the exact
       * position on the Bézier curve.
       */
      const progress =
        rawProgress < 0.5
          ? 2 * rawProgress * rawProgress
          : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2;

      const distance = progress * totalLength;

      const point = path.getPointAtLength(distance);

      const nextDistance = Math.min(distance + 1.5, totalLength);

      const nextPoint = path.getPointAtLength(nextDistance);

      const angle =
        Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) *
        (180 / Math.PI);

      const percent = svgPointToPercent(point);

      setPosition({
        x: percent.x,
        y: percent.y,
        angle,
        visible: true,
      });

      if (rawProgress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [active, pathRef]);

  return (
    <div
      className="pointer-events-none absolute z-20 w-[72px] sm:w-[96px]"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        opacity: position.visible ? 1 : 0,
        transform: `
          translate(-50%, -50%)
          rotate(${position.angle}deg)
        `,
        transition: "opacity 180ms ease",
      }}
    >
      <Truck className="w-full text-slate-950" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ROUTE SECTION                                                               */
/* -------------------------------------------------------------------------- */

function RouteSection() {
  const sectionRef = useRef(null);
  const pathRef = useRef(null);

  const [active, setActive] = useState(false);

  useEffect(() => {
    const element = sectionRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      {
        /*
         * The animation only starts when a meaningful
         * portion of the route is actually visible.
         */
        threshold: 0.3,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="route"
      className="bg-[#f7d75b] py-10 sm:py-14"
    >
      <PageContainer>
        <div className="flex items-end justify-between gap-5">
          <Reveal>
            <p className="font-body text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-950/40">
              02 · Move
            </p>

            <h2 className="mt-2 font-display text-[2.35rem] font-bold leading-[.9] tracking-[-0.055em] sm:text-6xl">
              From here
              <br />
              to there.
            </h2>
          </Reveal>

          <Reveal delay={0.08} className="hidden max-w-[190px] sm:block">
            <p className="font-body text-sm leading-5 text-slate-950/50">
              Your courier follows the route in real time.
            </p>
          </Reveal>
        </div>

        <Reveal className="mt-3 sm:mt-5">
          <div className="relative h-[145px] w-full sm:h-[175px]">
            <svg
              viewBox="0 0 900 180"
              className="absolute inset-0 h-full w-full overflow-visible"
              fill="none"
              preserveAspectRatio="none"
            >
              {/* Invisible path used by the truck */}
              <path
                ref={pathRef}
                d={DELIVERY_PATH}
                stroke="transparent"
                strokeWidth="1"
                fill="none"
              />

              {/* Visible route */}
              <motion.path
                d={DELIVERY_PATH}
                initial={{
                  pathLength: 0,
                }}
                animate={{
                  pathLength: active ? 1 : 0,
                }}
                transition={{
                  duration: 1.3,
                  ease: "easeInOut",
                }}
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="5 9"
                strokeLinecap="round"
                className="text-slate-950/35"
              />

              {/* Start */}
              <circle
                cx="35"
                cy="142"
                r="4"
                fill="currentColor"
                className="text-slate-950"
              />

              {/* Destination */}
              <circle
                cx="865"
                cy="38"
                r="4"
                fill="currentColor"
                className="text-slate-950"
              />
            </svg>

            {/* Exact Bézier path follower */}
            <CurvedRouteTruck active={active} pathRef={pathRef} />

            {/* Labels */}
            <div className="absolute bottom-0 left-0">
              <p className="font-body text-[9px] font-bold uppercase tracking-[0.14em]">
                Kilimani
              </p>
            </div>

            <div className="absolute right-0 top-0">
              <p className="font-body text-[9px] font-bold uppercase tracking-[0.14em]">
                Westlands
              </p>
            </div>
          </div>
        </Reveal>
      </PageContainer>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* TRACKING                                                                    */
/* -------------------------------------------------------------------------- */

const statuses = [
  "Order placed",
  "Courier assigned",
  "Picked up",
  "In transit",
  "Delivered",
];

function TrackingSection() {
  return (
    <section id="tracking" className="bg-slate-950 py-10 text-white sm:py-14">
      <PageContainer>
        <div className="grid gap-6 sm:grid-cols-[.8fr_1.2fr] sm:items-end sm:gap-12">
          <Reveal>
            <p className="font-body text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">
              03 · Track
            </p>

            <h2 className="mt-2 font-display text-[2.35rem] font-bold leading-[.9] tracking-[-0.055em] sm:text-6xl">
              Always know
              <br />
              where it is.
            </h2>
          </Reveal>

          <Reveal>
            <div className="border-t border-white/15">
              {statuses.map((status, index) => (
                <div
                  key={status}
                  className="flex items-center justify-between border-b border-white/15 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        index < 4 ? "bg-white" : "bg-white/20"
                      }`}
                    />

                    <span
                      className={`font-body text-sm ${
                        index < 4 ? "text-white" : "text-white/30"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <span className="font-mono text-[9px] text-white/20">
                    0{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </PageContainer>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* LANDING                                                                     */
/* -------------------------------------------------------------------------- */

export default function Landing() {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={HOME_BY_ROLE[role] || "/dashboard"} replace />;
  }

  return (
    <main className="overflow-hidden bg-[#f8f7f2] text-slate-950">
      {/* ================================================================== */}
      {/* NAVBAR                                                              */}
      {/* ================================================================== */}

      <header className="absolute inset-x-0 top-0 z-50">
        <PageContainer className="flex items-center justify-between py-4">
          <Link
            to="/"
            className="font-display text-2xl font-bold tracking-[-0.06em]"
          >
            Deliveroo
          </Link>

          <nav className="hidden items-center rounded-full bg-white/90 px-1.5 py-1.5 shadow-sm ring-1 ring-black/5 backdrop-blur md:flex">
            <a
              href="#route"
              className="px-4 py-1.5 font-body text-sm font-medium"
            >
              Route
            </a>

            <a
              href="#tracking"
              className="px-4 py-1.5 font-body text-sm font-medium"
            >
              Tracking
            </a>

            <a
              href="#how"
              className="px-4 py-1.5 font-body text-sm font-medium"
            >
              How it works
            </a>
          </nav>

          <Button
            as={Link}
            to="/login"
            variant="dark"
            className="rounded-full px-5 py-2 text-sm"
          >
            Sign in
          </Button>
        </PageContainer>
      </header>

      {/* ================================================================== */}
      {/* HERO                                                                */}
      {/* ================================================================== */}

      <section className="bg-[#f7d75b]">
        <PageContainer className="flex min-h-[590px] flex-col justify-center pb-3 pt-24 sm:min-h-[640px] sm:pt-28">
          <Reveal>
            <p className="font-body text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-950/40">
              Nairobi · parcel delivery
            </p>
          </Reveal>

          <motion.h1
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
              ease,
            }}
            className="mt-3 font-display text-[19vw] font-black leading-[.72] tracking-[-0.075em] sm:text-[17vw]"
          >
            Deliveroo
          </motion.h1>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <Reveal>
              <p className="max-w-[285px] font-body text-sm leading-5 text-slate-950/55 sm:text-base">
                Send something across Nairobi.
                <br />
                Watch it make its way there.
              </p>
            </Reveal>

            <Reveal delay={0.05}></Reveal>
          </div>

          <HeroJourney />
        </PageContainer>
      </section>

      {/* ================================================================== */}
      {/* SEND                                                                */}
      {/* ================================================================== */}

      <section id="how" className="bg-[#f8f7f2] py-10 sm:py-14">
        <PageContainer>
          <Reveal>
            <p className="font-body text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              01 · Send
            </p>

            <h2 className="mt-2 font-display text-[2.35rem] font-bold leading-[.9] tracking-[-0.055em] sm:text-6xl">
              Tell us where
              <br />
              it needs to go.
            </h2>
          </Reveal>

          <Reveal className="mt-5">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="grid sm:grid-cols-2">
                <div className="border-b border-slate-200 p-4 sm:border-b-0 sm:border-r sm:p-5">
                  <p className="font-body text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Pickup
                  </p>

                  <p className="mt-1.5 font-display text-lg font-semibold tracking-[-0.03em]">
                    Kilimani
                  </p>

                  <p className="mt-0.5 font-body text-xs text-slate-400">
                    Nairobi, Kenya
                  </p>
                </div>

                <div className="p-4 sm:p-5">
                  <p className="font-body text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Destination
                  </p>

                  <p className="mt-1.5 font-display text-lg font-semibold tracking-[-0.03em]">
                    Westlands
                  </p>

                  <p className="mt-0.5 font-body text-xs text-slate-400">
                    Nairobi, Kenya
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <p className="font-body text-[9px] uppercase tracking-[0.14em] text-slate-400">
                    Estimated
                  </p>

                  <p className="mt-1 font-display text-base font-semibold">
                    8.4 km · ~24 min
                  </p>
                </div>

                <Button
                  as={Link}
                  to="/register"
                  variant="dark"
                  className="w-full rounded-full sm:w-auto"
                >
                  Start delivery
                </Button>
              </div>
            </div>
          </Reveal>
        </PageContainer>
      </section>

      {/* ================================================================== */}
      {/* ROUTE                                                               */}
      {/* ================================================================== */}

      <RouteSection />

      {/* ================================================================== */}
      {/* TRACKING                                                            */}
      {/* ================================================================== */}

      <TrackingSection />

      {/* ================================================================== */}
      {/* HOW IT WORKS                                                        */}
      {/* ================================================================== */}

      <section className="bg-[#f8f7f2] py-10 sm:py-14">
        <PageContainer>
          <Reveal>
            <p className="font-body text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              How it works
            </p>

            <h2 className="mt-2 font-display text-[2.35rem] font-bold leading-[.9] tracking-[-0.055em] sm:text-6xl">
              Three steps.
              <br />
              That's it.
            </h2>
          </Reveal>

          <div className="mt-5 border-t border-slate-200">
            {[
              ["01", "Choose your route.", "Pickup and destination."],
              ["02", "Choose your parcel.", "Weight sets the price."],
              ["03", "Let it move.", "Track it until it arrives."],
            ].map(([number, title, text], index) => (
              <Reveal key={number} delay={index * 0.03}>
                <div className="grid grid-cols-[34px_1fr] gap-2 border-b border-slate-200 py-4 sm:grid-cols-[55px_1fr_1fr] sm:items-center sm:gap-5">
                  <span className="font-mono text-[9px] text-slate-400">
                    {number}
                  </span>

                  <h3 className="font-display text-base font-semibold tracking-[-0.03em] sm:text-xl">
                    {title}
                  </h3>

                  <p className="col-start-2 font-body text-xs text-slate-500 sm:col-start-auto sm:text-sm">
                    {text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* ================================================================== */}
      {/* FINAL CTA                                                           */}
      {/* ================================================================== */}

      <section className="bg-[#f7d75b] py-12 sm:py-16">
        <PageContainer>
          <Reveal className="text-center">
            <p className="font-body text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-950/40">
              Ready?
            </p>

            <h2 className="mt-2 font-display text-6xl font-black leading-[.8] tracking-[-0.065em] sm:text-8xl">
              Send it.
            </h2>

            <p className="mx-auto mt-3 max-w-xs font-body text-sm leading-5 text-slate-950/50">
              Give it a destination.
              <br />
              We'll take care of the journey.
            </p>

            <div className="mt-4">
              <Button
                as={Link}
                to="/register"
                variant="dark"
                size="lg"
                className="rounded-full px-8"
              >
                Start a delivery
              </Button>
            </div>
          </Reveal>
        </PageContainer>
      </section>

      {/* ================================================================== */}
      {/* FOOTER                                                             */}
      {/* ================================================================== */}

      <footer className="bg-slate-950 py-5 text-white">
        <PageContainer className="flex items-center justify-between">
          <Link
            to="/"
            className="font-display text-xl font-bold tracking-[-0.05em]"
          >
            Deliveroo
          </Link>

          <p className="font-body text-[9px] text-white/30">
            Nairobi · parcel delivery
          </p>
        </PageContainer>
      </footer>
    </main>
  );
}
