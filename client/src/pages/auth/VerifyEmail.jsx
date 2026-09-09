import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'

import Button from '@/components/ui/Button'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Input from '@/components/ui/Input'
import { PageContainer } from '@/components/layout/AppShell'
import {
  clearAuthError,
  resendCode,
  selectAuthError,
  verifyEmail,
} from '@/features/auth/authSlice'
import { HOME_BY_ROLE } from '@/utils/constants'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'

const CODE_LENGTH = 6

export default function VerifyEmail() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const serverError = useSelector(selectAuthError)
  const { isAuthenticated, role, submitting } = useAuth()

  const email = location.state?.email || ''
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(60)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = window.setInterval(() => setCooldown((left) => Math.max(0, left - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  if (isAuthenticated) {
    return <Navigate to={HOME_BY_ROLE[role] || '/dashboard'} replace />
  }

  if (!email) {
    return <Navigate to="/register" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (code.length !== CODE_LENGTH) return

    const result = await dispatch(verifyEmail({ email, code }))
    if (verifyEmail.fulfilled.match(result)) {
      toast.success('Email confirmed. Welcome to Deliveroo.')
      navigate(HOME_BY_ROLE[result.payload.role] || '/dashboard', { replace: true })
    }
  }

  const handleResend = async () => {
    setSending(true)
    const result = await dispatch(resendCode({ email }))
    setSending(false)
    if (resendCode.fulfilled.match(result)) {
      setCooldown(result.payload.retry_after || 60)
      setCode('')
      toast.info('If that account still needs confirming, a new code is on its way.')
    }
  }

  return (
    <PageContainer className="max-w-lg">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 sm:p-8">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">
            Confirm your email
          </h1>
          <p className="mt-2 font-body text-base text-slate-500">
            We sent a {CODE_LENGTH} digit code to{' '}
            <span className="font-semibold text-slate-900">{email}</span>. It expires in 15
            minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          {serverError && <ErrorMessage compact message={serverError} />}

          <Input
            label="Confirmation code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            value={code}
            onChange={(event) => {
              if (serverError) dispatch(clearAuthError())
              setCode(event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))
            }}
            placeholder="000000"
            inputClassName="text-center font-mono text-2xl tracking-[0.4em]"
            autoFocus
            required
          />

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={code.length !== CODE_LENGTH}
          >
            Confirm and sign in
          </Button>
        </form>

        <div className="mt-6 text-center font-body text-sm text-slate-500">
          {cooldown > 0 ? (
            <p>You can ask for another code in {cooldown}s.</p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={sending}
              className="font-semibold text-brand-700 underline-offset-4 hover:underline disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send me another code'}
            </button>
          )}
        </div>

        <p className="mt-4 text-center font-body text-sm text-slate-500">
          Wrong address?{' '}
          <Link
            to="/register"
            className="font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            Start again
          </Link>
        </p>
      </div>
    </PageContainer>
  )
}
