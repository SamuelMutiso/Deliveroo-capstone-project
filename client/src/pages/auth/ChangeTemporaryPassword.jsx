import { Navigate, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useState } from 'react'
import { Eye, EyeOff, ShieldAlert } from 'lucide-react'

import Button from '@/components/ui/Button'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Input from '@/components/ui/Input'
import { PageContainer } from '@/components/layout/AppShell'
import { changePassword, clearAuthError, selectAuthError } from '@/features/auth/authSlice'
import { HOME_BY_ROLE } from '@/utils/constants'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'

export default function ChangeTemporaryPassword() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()
  const serverError = useSelector(selectAuthError)
  const { user, role, isAuthenticated } = useAuth()

  const [values, setValues] = useState({ current: '', next: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user?.must_change_password) {
    return <Navigate to={HOME_BY_ROLE[role] || '/dashboard'} replace />
  }

  const set = (patch) => {
    if (serverError) dispatch(clearAuthError())
    setValues((current) => ({ ...current, ...patch }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const found = {}
    if (!values.current) found.current = 'Enter the password we emailed you'
    if (values.next.length < 8) found.next = 'Use at least 8 characters'
    if (values.next && values.next === values.current) {
      found.next = 'Choose something different from the temporary one'
    }
    if (values.next !== values.confirm) found.confirm = 'Both passwords must match'

    setErrors(found)
    if (Object.keys(found).length) return

    setSaving(true)
    const result = await dispatch(
      changePassword({ current_password: values.current, new_password: values.next }),
    )
    setSaving(false)

    if (changePassword.fulfilled.match(result)) {
      toast.success('Password updated. Welcome aboard.')
      navigate(HOME_BY_ROLE[role] || '/dashboard', { replace: true })
    }
  }

  return (
    <PageContainer className="max-w-lg">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 sm:p-8">
        <div className="flex items-start gap-3.5 rounded-xl bg-brand-50 p-4 ring-1 ring-inset ring-brand-200">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
          <p className="font-body text-sm text-brand-900">
            You signed in with a temporary password. Choose your own before you carry on — nothing
            else is available until you do.
          </p>
        </div>

        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-slate-950">
          Set your password
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {serverError && <ErrorMessage compact message={serverError} />}

          <Input
            label="Temporary password"
            type="password"
            autoComplete="current-password"
            value={values.current}
            onChange={(event) => set({ current: event.target.value })}
            error={errors.current}
          />

          <div className="relative">
            <Input
              label="New password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={values.next}
              onChange={(event) => set({ next: event.target.value })}
              error={errors.next}
              hint={errors.next ? undefined : 'At least 8 characters'}
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              className="absolute right-3.5 top-9 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Input
            label="Confirm new password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={values.confirm}
            onChange={(event) => set({ confirm: event.target.value })}
            error={errors.confirm}
          />

          <Button type="submit" size="lg" fullWidth loading={saving}>
            Save and continue
          </Button>
        </form>
      </div>
    </PageContainer>
  )
}
