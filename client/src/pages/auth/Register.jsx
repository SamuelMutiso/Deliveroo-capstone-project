import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import Button from '@/components/ui/Button'
import GoogleSignIn from '@/components/auth/GoogleSignIn'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Input from '@/components/ui/Input'
import { PageContainer } from '@/components/layout/AppShell'
import { clearAuthError, register, selectAuthError } from '@/features/auth/authSlice'
import { HOME_BY_ROLE, ROLES } from '@/utils/constants'
import { isEmpty, validateRegister } from '@/utils/validators'
import { useAuth } from '@/hooks/useAuth'

export default function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
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

  // States to track password visibility
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={HOME_BY_ROLE[role] || '/dashboard'} replace />
  }

  const set = (patch) => {
    if (serverError) dispatch(clearAuthError())
    setValues((current) => ({ ...current, ...patch }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = validateRegister(values)
    setErrors(found)
    if (!isEmpty(found)) return

    const email = values.email.trim()
    const result = await dispatch(
      register({
        name: values.name.trim(),
        email,
        phone: values.phone.trim() || null,
        password: values.password,
        role: values.role,
      }),
    )

    if (register.fulfilled.match(result)) {
      navigate('/verify-email', { state: { email } })
    }
  }

  return (
    <PageContainer className="max-w-xl">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 sm:p-8">
        
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">
            Create your account
          </h1>
          <p className="mt-1.5 font-body text-base text-slate-500">
            It takes a minute. 
            You can start sending parcels straight away.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-3.5">
          {serverError && <ErrorMessage compact message={serverError} />}

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
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={values.password}
                onChange={(event) => set({ password: event.target.value })}
                error={errors.password}
                hint="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={values.confirmPassword}
                onChange={(event) => set({ confirmPassword: event.target.value })}
                error={errors.confirmPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 focus:outline-none"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" fullWidth loading={submitting}>
            Create account
          </Button>
        </form>

        <GoogleSignIn label="signup_with" />

        <p className="mt-6 text-center font-body text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
            Sign in instead
          </Link>
        </p>
      </div>
    </PageContainer>
  )
}
