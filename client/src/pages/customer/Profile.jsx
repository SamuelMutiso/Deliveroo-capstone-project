import { useDispatch } from 'react-redux'
import { useRef, useState } from 'react'

import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { PageContainer, PageHeader } from '@/components/layout/AppShell'
import { squarePhotoDataUrl } from '@/utils/image'
import { changePassword, updateProfile } from '@/features/auth/authSlice'
import { fullDate } from '@/utils/formatters'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'

export default function Profile() {
  const dispatch = useDispatch()
  const toast = useToast()
  const { user, isCourier } = useAuth()
  const fileInput = useRef(null)

  const [values, setValues] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    vehicle: user?.vehicle || '',
  })
  const [photo, setPhoto] = useState(user?.photo_url || null)
  const [saving, setSaving] = useState(false)
  const [busyPhoto, setBusyPhoto] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [passwordError, setPasswordError] = useState(null)
  const [changingPassword, setChangingPassword] = useState(false)

  const savePhoto = async (dataUrl, successMessage) => {
    setBusyPhoto(true)
    const result = await dispatch(updateProfile({ photo_url: dataUrl }))
    setBusyPhoto(false)

    if (updateProfile.fulfilled.match(result)) {
      setPhoto(dataUrl)
      toast.success(successMessage)
      return
    }
    toast.error(result.payload || 'Could not save your photo')
  }

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const dataUrl = await squarePhotoDataUrl(file)
      await savePhoto(dataUrl, 'Photo updated')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    const payload = { name: values.name.trim(), phone: values.phone.trim() || null }
    if (isCourier) payload.vehicle = values.vehicle.trim() || null

    const result = await dispatch(updateProfile(payload))
    setSaving(false)

    if (updateProfile.fulfilled.match(result)) {
      toast.success('Profile saved')
    } else {
      toast.error(result.payload || 'Could not save your profile')
    }
  }

  const handlePassword = async (event) => {
    event.preventDefault()
    setPasswordError(null)

    if (passwords.next.length < 8) {
      setPasswordError('The new password must be at least 8 characters')
      return
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError('The two new passwords do not match')
      return
    }

    setChangingPassword(true)
    const result = await dispatch(
      changePassword({ current_password: passwords.current, new_password: passwords.next }),
    )
    setChangingPassword(false)

    if (changePassword.fulfilled.match(result)) {
      setPasswords({ current: '', next: '', confirm: '' })
      toast.success('Password changed')
    } else {
      setPasswordError(result.payload || 'Could not change your password')
    }
  }

  return (
    <PageContainer className="max-w-2xl">
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description={
          isCourier
            ? 'Customers see your photo, name and vehicle when you are assigned to their delivery.'
            : 'Keep your contact details current so riders and operations can reach you.'
        }
      />

      <div className="mt-6 flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 sm:flex-row sm:items-center sm:gap-6">
        <Avatar name={user?.name} photo={photo} size="lg" className="self-start sm:self-auto" />

        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-semibold text-slate-950">{user?.name}</p>
          <p className="truncate font-body text-sm text-slate-500">{user?.email}</p>
          <p className="font-body text-xs capitalize text-slate-400">
            {user?.role} · joined {fullDate(user?.created_at)}
          </p>

          <div className="mt-3.5 flex flex-wrap gap-2.5">
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
            <Button
              type="button"
              size="sm"
              loading={busyPhoto}
              onClick={() => fileInput.current?.click()}
            >
              {photo ? 'Change photo' : 'Upload a photo'}
            </Button>
            {photo && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busyPhoto}
                onClick={() => savePhoto(null, 'Photo removed')}
              >
                Remove
              </Button>
            )}
          </div>

          {isCourier && (
            <p className="mt-2.5 font-body text-xs text-slate-400">
              A clear photo of your face helps customers confirm they are handing the parcel to the
              right person.
            </p>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-3.5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 sm:p-8"
      >
        <Input
          label="Full name"
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
        />
        <Input
          label="Phone number"
          value={values.phone}
          onChange={(event) => setValues({ ...values, phone: event.target.value })}
          placeholder="0712345678"
          inputMode="tel"
        />
        {isCourier && (
          <Input
            label="Vehicle"
            value={values.vehicle}
            onChange={(event) => setValues({ ...values, vehicle: event.target.value })}
            placeholder="Motorbike KMFA 221P"
            hint="Shown to customers tracking your deliveries"
          />
        )}
        <Input label="Email address" value={user?.email || ''} disabled hint="Email cannot be changed" />

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>

      <form
        onSubmit={handlePassword}
        className="mt-6 flex flex-col gap-3.5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 sm:p-8"
      >
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-950">Change password</h2>
          <p className="mt-0.5 font-body text-sm text-slate-500">
            {isCourier
              ? 'Riders start on a temporary password. Change it to something only you know.'
              : 'Use at least 8 characters.'}
          </p>
        </div>

        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={passwords.current}
          onChange={(event) => setPasswords({ ...passwords, current: event.target.value })}
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          value={passwords.next}
          onChange={(event) => setPasswords({ ...passwords, next: event.target.value })}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={passwords.confirm}
          onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })}
          error={passwordError}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="outline"
            loading={changingPassword}
            disabled={!passwords.current || !passwords.next}
          >
            Change password
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}
