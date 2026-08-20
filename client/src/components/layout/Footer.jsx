import { Link } from 'react-router-dom'

import { PUBLIC_NAV } from '@/utils/constants'

//Initialised properties to be used in the Footer component
const COLUMNS = [
  {
    heading: 'Company',
    links: PUBLIC_NAV.filter((item) => item.to !== '/'),
  },
  {
    heading: 'Get started',
    links: [
      { to: '/register', label: 'Sign up' },
      { to: '/login', label: 'Sign in' },
    ],
  },
]

const LEGAL = [
  { to: '/services', label: 'Terms of service' },
  { to: '/services', label: 'Privacy policy' },
  { to: '/about', label: 'Contact us' },
]

const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-3.5 py-8 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-400">
                <svg viewBox="0 0 32 32" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M8 21 14 9l4 7.5L20 13l4 8z" fill="#3f2103" />
                </svg>
              </span>
              <span className="font-display text-base font-bold tracking-tight text-slate-950">
                Deliveroo
              </span>
            </Link>
            <p className="mt-3.5 max-w-prose font-body text-sm text-slate-500">
              Parcel delivery management for Nairobi. Quote it, track it, pay for it — without the
              phone tag.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {column.heading}
              </p>
              <ul className="mt-1.5 flex flex-col">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="inline-block py-1.5 font-body text-sm text-slate-600 underline-offset-4 transition hover:text-slate-950 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3.5 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-xs text-slate-400">
            © {YEAR} Deliveroo Logistics Kenya Ltd. Nairobi, Kenya.
          </p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {LEGAL.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="inline-block py-1 font-body text-xs text-slate-400 underline-offset-4 transition hover:text-slate-700 hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}