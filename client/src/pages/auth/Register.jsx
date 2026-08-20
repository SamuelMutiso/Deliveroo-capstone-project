import { Link, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useState } from 'react'

import Button from '@/components/ui/Button'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Input from '@/components/ui/Input'
import { PageContainer } from '@/components/layout/AppShell'
import { clearAuthError, register, selectAuthError } from '@/features/auth/authSlice'
import { HOME_BY_ROLE, ROLES } from '@/utils/constants'
import { isEmpty, validateRegister } from '@/utils/validators'
import { useAuth } from '@/hooks/useAuth'

const ROLE_CHOICES = [
  {
    value: ROLES.CUSTOMER,
    title: 'I send parcels',
    body: 'Create deliveries, track them and pay with M-Pesa.',
  },
  {
    value: ROLES.COURIER,
    title: 'I deliver parcels',
    body: 'Pick up assigned runs and update progress on the road.',
  },
]

export default function Register() {
  const dispatch = useDispatch()
  const serverError = useSelector(selectAuthError)
  const { isAuthenticated, role, submitting } = useAuth()

  const [values, setValues] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: ROLES.CUSTOMER,
  })
  const [errors, setErrors] = useState({})

  if (isAuthenticated) {
    return <Navigate to={HOME_BY_ROLE[role] || '/dashboard'} replace />
  }

  const set = (patch) => {
    if (serverError) dispatch(clearAuthError())
    setValues((current) => ({ ...current, ...patch }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const found = validateRegister(values)
    setErrors(found)
    if (!isEmpty(found)) return

    dispatch(
      register({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || null,
        password: values.password,
        role: values.role,
      }),
    )
  }

  return (
    <PageContainer className="max-w-xl">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 sm:p-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">
          Create your account
        </h1>
        <p className="mt-1.5 font-body text-base text-slate-500">
          It takes a minute. You can start sending parcels straight away.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-3.5">
          {serverError && <ErrorMessage compact message={serverError} />}

          <fieldset>
            <legend className="font-body text-sm font-semibold text-slate-700">
              How will you use Deliveroo?
            </legend>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              {ROLE_CHOICES.map((choice) => {
                const active = values.role === choice.value
                return (
                  <label
                    key={choice.value}
                    className={[
                      'flex cursor-pointer flex-col gap-0.5 rounded-xl p-3.5 transition',
                      'ring-1 ring-inset focus-within:ring-2 focus-within:ring-brand-500',
                      active ? 'bg-brand-50 ring-brand-500' : 'bg-white ring-slate-200 hover:ring-slate-300',
                    ].join(' ')}
                  >
                    <span className="flex items-center justify-between gap-2.5">
                      <span className="font-display text-base font-semibold text-slate-900">
                        {choice.title}
                      </span>
                      <input
                        type="radio"
                        name="role"
                        value={choice.value}
                        checked={active}
                        onChange={() => set({ role: choice.value })}
                        className="h-4 w-4 accent-brand-600"
                      />
                    </span>
                    <span className="font-body text-sm text-slate-500">{choice.body}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <Input
            label="Full name"
            autoComplete="name"
            value={values.name}
            onChange={(event) => set({ name: event.target.value })}
            error={errors.name}
            placeholder="Amina Wanjiru"
          />
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
            label="Phone number"
            autoComplete="tel"
            inputMode="tel"
            value={values.phone}
            onChange={(event) => set({ phone: event.target.value })}
            error={errors.phone}
            placeholder="0712345678"
            hint="Optional, but it helps couriers reach you"
          />

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => set({ password: event.target.value })}
              error={errors.password}
              hint="At least 8 characters"
            />
            <Input
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={(event) => set({ confirmPassword: event.target.value })}
              error={errors.confirmPassword}
            />
          </div>

          <Button type="submit" size="lg" fullWidth loading={submitting}>
            Create account
          </Button>
        </form>

        <p className="mt-6 font-body text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
            Sign in instead
          </Link>
        </p>
      </div>
    </PageContainer>
  )
}
