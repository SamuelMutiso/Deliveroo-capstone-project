import { Link, NavLink, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useEffect, useState } from 'react'

import Button from '@/components/ui/Button'
import { logout } from '@/features/auth/authSlice'
import { useAuth } from '@/hooks/useAuth'
import { HOME_BY_ROLE, NAV_BY_ROLE, PUBLIC_NAV, ROLE_LABEL } from '@/utils/constants'
import { initials } from '@/utils/formatters'

const ROLE_ACCENT = {
  customer: 'bg-blue-100 text-blue-700',
  courier: 'bg-amber-100 text-amber-700',
  admin: 'bg-brand-100 text-brand-800',
}

export default function Navbar() {
  const dispatch = useDispatch()
  const location = useLocation()
  const { user, role, isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  const links = isAuthenticated ? NAV_BY_ROLE[role] || [] : PUBLIC_NAV
  const home = isAuthenticated ? HOME_BY_ROLE[role] || '/' : '/'

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3.5 px-3.5 sm:px-6">
        <Link to={home} className="flex items-center gap-2.5" aria-label="Deliveroo home">
          <Logo />
          <span className="font-display text-lg font-bold tracking-tight text-slate-950">
            Deliveroo
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                [
                  'rounded-full px-3.5 py-1.5 font-body text-sm font-semibold transition',
                  isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100',
                ].join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          {isAuthenticated ? (
            <>
              <div className="hidden items-center gap-2.5 sm:flex">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-body text-sm font-bold text-brand-800">
                  {initials(user?.name)}
                </span>
                <div className="hidden xl:block">
                  <p className="font-body text-sm font-semibold leading-tight text-slate-900">
                    {user?.name}
                  </p>
                  <span
                    className={`inline-flex rounded-full px-2.5 font-body text-xs font-semibold ${ROLE_ACCENT[role] || 'bg-slate-100 text-slate-600'}`}
                  >
                    {ROLE_LABEL[role] || role}
                  </span>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => dispatch(logout())}>
                Sign out
              </Button>
            </>
          ) : (
            <div className="hidden items-center gap-2.5 sm:flex">
              <Button as={Link} to="/login" size="sm" variant="ghost">
                Sign in
              </Button>
              <Button as={Link} to="/register" size="sm" variant="dark">
                Sign up
              </Button>
            </div>
          )}

          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="rounded-xl p-1.5 text-slate-600 transition hover:bg-slate-100 lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
              <path
                d={open ? 'M6 6l12 12M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16'}
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="border-t border-slate-100 bg-white px-3.5 pb-3.5 lg:hidden"
          aria-label="Mobile navigation"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                [
                  'mt-1.5 block rounded-xl px-3.5 py-2.5 font-body text-base font-medium',
                  isActive ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-50',
                ].join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}

          {!isAuthenticated && (
            <div className="mt-3.5 flex flex-col gap-2.5 border-t border-slate-100 pt-3.5">
              <Button as={Link} to="/login" variant="outline" fullWidth>
                Sign in
              </Button>
              <Button as={Link} to="/register" variant="dark" fullWidth>
                Sign up
              </Button>
            </div>
          )}
        </nav>
      )}
    </header>
  )
}

function Logo() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-400 shadow-inner">
      <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" aria-hidden="true">
        <path d="M8 21 14 9l4 7.5L20 13l4 8z" fill="#3f2103" />
      </svg>
    </span>
  )
}