import { Link, Navigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import Button from '@/components/ui/Button'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Input from '@/components/ui/Input'
import { PageContainer } from '@/components/layout/AppShell'
import {
  clearAuthError,
  login,
  selectAuthError,
} from '@/features/auth/authSlice'
import { isEmpty, validateLogin } from '@/utils/validators'
import { useAuth } from '@/hooks/useAuth'
import { HOME_BY_ROLE } from '@/utils/constants'

export default function Login() {
  const dispatch = useDispatch()
  const location = useLocation()
  const serverError = useSelector(selectAuthError)
  const { isAuthenticated, role, submitting } = useAuth()

  const [values, setValues] = useState({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  if (isAuthenticated) {
    return (
      <Navigate
        to={
          location.state?.from ||
          HOME_BY_ROLE[role] ||
          '/dashboard'
        }
        replace
      />
    )
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const found = validateLogin(values)

    setErrors(found)

    if (isEmpty(found)) {
      dispatch(login(values))
    }
  }

  const set = (patch) => {
    if (serverError) {
      dispatch(clearAuthError())
    }

    setValues((current) => ({
      ...current,
      ...patch,
    }))
  }

  return (
    <PageContainer className="max-w-lg">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 sm:p-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">
            Welcome back
          </h1>

          <p className="mt-1.5 font-body text-base text-slate-500">
            Sign in to your account.
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-8 flex flex-col gap-3.5"
        >
          {serverError && (
            <ErrorMessage
              compact
              message={serverError}
            />
          )}

          {/* Email */}
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) =>
              set({ email: event.target.value })
            }
            error={errors.email}
            placeholder="you@example.com"
          />

          {/* Password */}
          <div>
            {/* Password label + Forgot Password */}
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Password
              </span>

              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-brand-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <Input
                label=""
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={values.password}
                onChange={(event) =>
                  set({ password: event.target.value })
                }
                error={errors.password}
                placeholder="••••••••"
              />

              {/* Show / Hide Password */}
              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                className="absolute right-3 top-[14px] text-slate-400 hover:text-slate-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={submitting}
          >
            Sign in
          </Button>
        </form>

        {/* Register Link */}
        <p className="mt-6 text-center font-body text-sm text-slate-500">
          New here?{' '}

          <Link
            to="/register"
            className="font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>

      </div>
    </PageContainer>
  )
}