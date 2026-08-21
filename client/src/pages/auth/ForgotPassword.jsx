import { Link } from 'react-router-dom'
import { useState } from 'react'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { PageContainer } from '@/components/layout/AppShell'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!email.trim()) {
      return
    }

    setSubmitted(true)
  }

  return (
    <PageContainer className="max-w-lg">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 sm:p-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">
            Forgot your password?
          </h1>

          <p className="mt-2 font-body text-base text-slate-500">
            Enter your email address and we’ll send you
            a link to reset your password.
          </p>
        </div>

        {/* Success Message */}
        {submitted ? (
          <div className="mt-8 rounded-lg bg-green-50 p-4 text-center">
            <p className="text-sm font-medium text-green-700">
              If an account exists with that email, you will
              receive a password reset link shortly.
            </p>
          </div>
        ) : (

          /* Forgot Password Form */
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col gap-4"
          >
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              required
            />

            <Button
              type="submit"
              size="lg"
              fullWidth
            >
              Send reset link
            </Button>
          </form>
        )}

        {/* Back to Login */}
        <p className="mt-6 text-center font-body text-sm text-slate-500">
          Remember your password?{' '}

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