import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import Button from '@/components/ui/Button'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Input from '@/components/ui/Input'
import { PageContainer } from '@/components/layout/AppShell'
import { authApi } from '@/api/authApi'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [values, setValues] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [done, setDone] = useState(false)

  const set = (patch) => {
    setServerError('')
    setValues((current) => ({ ...current, ...patch }))
  }

  const validate = () => {
    const found = {}

    if (values.password.length < 8) {
      found.password = 'Password must be at least 8 characters'
    }

    if (values.confirm !== values.password) {
      found.confirm = 'Passwords do not match'
    }

    return found
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const found = validate()
    setErrors(found)

    if (Object.keys(found).length > 0 || submitting) {
      return
    }

    setSubmitting(true)
    setServerError('')

    try {
      await authApi.resetPassword({ token, new_password: values.password })
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (error) {
      setServerError(
        error.response?.data?.message ||
          'This reset link is invalid or has already been used.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageContainer className="max-w-lg">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 sm:p-8">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">
            Choose a new password
          </h1>

          <p className="mt-2 font-body text-base text-slate-500">
            Pick something you have not used before. It must be at least 8 characters.
          </p>
        </div>

        {!token ? (
          <div className="mt-8">
            <ErrorMessage
              title="This link is incomplete"
              message="Open the link exactly as it appears in your email, or request a new one."
            />

            <div className="mt-4">
              <Button as={Link} to="/forgot-password" size="lg" fullWidth>
                Request a new link
              </Button>
            </div>
          </div>
        ) : done ? (
          <div className="mt-8 rounded-lg bg-green-50 p-4 text-center">
            <p className="text-sm font-medium text-green-700">
              Password changed. Taking you to sign in…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            {serverError && <ErrorMessage compact message={serverError} />}

            <Input
              label="New password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => set({ password: event.target.value })}
              error={errors.password}
              placeholder="At least 8 characters"
              required
            />

            <Input
              label="Confirm new password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={values.confirm}
              onChange={(event) => set({ confirm: event.target.value })}
              error={errors.confirm}
              placeholder="Type it again"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="flex items-center gap-1.5 self-start font-body text-sm font-semibold text-slate-500 hover:text-slate-800"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
              {showPassword ? 'Hide passwords' : 'Show passwords'}
            </button>

            <Button type="submit" size="lg" fullWidth loading={submitting}>
              {submitting ? 'Saving…' : 'Reset password'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center font-body text-sm text-slate-500">
          Remembered it?{' '}

          <Link
            to="/login"
            className="font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </PageContainer>
  )
}
