import { Link, Navigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useState } from 'react'

import Button from '@/components/ui/Button'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Input from '@/components/ui/Input'
import { PageContainer } from '@/components/layout/AppShell'
import { clearAuthError, login, selectAuthError } from '@/features/auth/authSlice'
import { isEmpty, validateLogin } from '@/utils/validators'
import { useAuth } from '@/hooks/useAuth'
import { HOME_BY_ROLE } from '@/utils/constants'

const DEMO_ACCOUNTS = [
  { role: 'Customer', email: 'amina@deliveroo.test', password: 'customer1234' },
  { role: 'Courier', email: 'peter@deliveroo.test', password: 'courier1234' },
  { role: 'Admin', email: 'admin@deliveroo.test', password: 'admin1234' },
]

export default function Login() {
  const dispatch = useDispatch()
  const location = useLocation()
  const serverError = useSelector(selectAuthError)
  const { isAuthenticated, role, submitting } = useAuth()

  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  if (isAuthenticated) {
    return <Navigate to={location.state?.from || HOME_BY_ROLE[role] || '/dashboard'} replace />
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const found = validateLogin(values)
    setErrors(found)
    if (isEmpty(found)) dispatch(login(values))
  }

  const set = (patch) => {
    if (serverError) dispatch(clearAuthError())
    setValues((current) => ({ ...current, ...patch }))
  }

  return (
    <PageContainer className="max-w-lg">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 sm:p-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">
          Welcome back
        </h1>
        <p className="mt-1.5 font-body text-base text-slate-500">
          Sign in to track parcels, run your route or manage the board.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-3.5">
          {serverError && <ErrorMessage compact message={serverError} />}

          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => set({ email: event.target.value })}
            error={errors.email}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={(event) => set({ password: event.target.value })}
            error={errors.password}
            placeholder="••••••••"
          />

          <Button type="submit" size="lg" fullWidth loading={submitting}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 font-body text-sm text-slate-500">
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-6">
        <p className="font-body text-xs uppercase tracking-[0.14em] text-slate-400">
          Seeded demo accounts
        </p>
        <ul className="mt-2.5 flex flex-col gap-1.5">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email} className="flex flex-wrap items-center justify-between gap-2.5">
              <span className="font-body text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{account.role}</span> · {account.email}
              </span>
              <button
                type="button"
                onClick={() => set({ email: account.email, password: account.password })}
                className="rounded-full bg-slate-100 px-3.5 py-0.5 font-body text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Use
              </button>
            </li>
          ))}
        </ul>
      </div>
    </PageContainer>
  )
}
