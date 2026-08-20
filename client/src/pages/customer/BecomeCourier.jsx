import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { PageContainer, PageHeader } from '@/components/layout/AppShell'
import {
  fetchMyApplication,
  fetchVehicleTypes,
  selectApplicationSubmitError,
  selectApplicationSubmitting,
  selectMyApplication,
  selectVehicleTypes,
  submitApplication,
  withdrawApplication,
} from '@/features/applications/applicationsSlice'
import { fullDate } from '@/utils/formatters'
import { squarePhotoDataUrl } from '@/utils/image'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'

const blank = {
  full_name: '',
  phone: '',
  licence_number: '',
  vehicle_type: 'motorbike',
  vehicle_ownership: 'own',
  vehicle_registration: '',
}

export default function BecomeCourier() {
  const dispatch = useDispatch()
  const toast = useToast()
  const { user } = useAuth()

  const application = useSelector(selectMyApplication)
  const vehicleTypes = useSelector(selectVehicleTypes)
  const submitting = useSelector(selectApplicationSubmitting)
  const submitError = useSelector(selectApplicationSubmitError)

  const [values, setValues] = useState({
    ...blank,
    full_name: user?.name || '',
    phone: user?.phone || '',
  })
  const [profilePhoto, setProfilePhoto] = useState(user?.photo_url || null)
  const [vehiclePhoto, setVehiclePhoto] = useState(null)
  const [errors, setErrors] = useState({})

  const profileInput = useRef(null)
  const vehicleInput = useRef(null)

  useEffect(() => {
    dispatch(fetchMyApplication())
    dispatch(fetchVehicleTypes())
  }, [dispatch])

  const set = (patch) => setValues((current) => ({ ...current, ...patch }))
  const ownsVehicle = values.vehicle_ownership === 'own'

  const pickPhoto = async (file, setter) => {
    if (!file) return
    try {
      setter(await squarePhotoDataUrl(file))
    } catch (error) {
      toast.error(error.message)
    }
  }

  const validate = () => {
    const next = {}
    if (values.full_name.trim().length < 2) next.full_name = 'Give your full name'
    if (values.phone.trim().length < 7) next.phone = 'Give a phone number we can reach you on'
    if (values.licence_number.trim().length < 4) next.licence_number = 'Give your driving licence number'
    if (!profilePhoto) next.profile_photo_url = 'Add a photo of yourself'
    if (ownsVehicle && !values.vehicle_registration.trim())
      next.vehicle_registration = 'Give the number plate'
    if (ownsVehicle && !vehiclePhoto) next.vehicle_photo_url = 'Add a photo of your vehicle'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    const result = await dispatch(
      submitApplication({
        full_name: values.full_name.trim(),
        phone: values.phone.trim(),
        licence_number: values.licence_number.trim(),
        vehicle_type: values.vehicle_type,
        vehicle_ownership: values.vehicle_ownership,
        vehicle_registration: ownsVehicle ? values.vehicle_registration.trim() : null,
        vehicle_photo_url: ownsVehicle ? vehiclePhoto : null,
        profile_photo_url: profilePhoto,
      }),
    )

    if (submitApplication.fulfilled.match(result)) {
      toast.success('Application sent. Operations will review it shortly.')
    }
  }

  if (application && application.status === 'pending') {
    return (
      <PageContainer className="max-w-2xl">
        <PageHeader eyebrow="Ride with us" title="Application received" />
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 sm:p-8">
          <p className="font-body text-base text-slate-700">
            We got your application on {fullDate(application.created_at)} and operations are
            reviewing it. You will get an email and a text once a decision is made.
          </p>
          <dl className="mt-5 flex flex-col gap-2.5 border-t border-slate-100 pt-5">
            <Row label="Licence" value={application.licence_number} />
            <Row label="Vehicle" value={application.vehicle_label} />
            <Row label="Phone" value={application.phone} />
          </dl>
          <Button
            variant="outline"
            className="mt-6"
            onClick={async () => {
              const result = await dispatch(withdrawApplication(application.id))
              if (withdrawApplication.fulfilled.match(result)) toast.success('Application withdrawn')
            }}
          >
            Withdraw application
          </Button>
        </div>
      </PageContainer>
    )
  }

  if (application && application.status === 'approved') {
    return (
      <PageContainer className="max-w-2xl">
        <PageHeader eyebrow="Ride with us" title="You are approved" />
        <div className="mt-6 rounded-2xl bg-brand-100 p-6 ring-1 ring-inset ring-brand-300 sm:p-8">
          <p className="font-body text-base text-brand-950">
            You have been cleared to ride. Sign in with the details below, then change the password
            from your profile.
          </p>

          <dl className="mt-5 flex flex-col gap-3.5 rounded-xl bg-white/70 p-5">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3.5">
              <dt className="font-body text-sm text-brand-900">Rider sign-in</dt>
              <dd className="select-all break-all font-mono text-sm font-medium text-brand-950">
                {application.company_email}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3.5">
              <dt className="font-body text-sm text-brand-900">Temporary password</dt>
              <dd className="select-all font-mono text-sm font-medium text-brand-950">
                {application.temporary_password || 'Sent to your email'}
              </dd>
            </div>
          </dl>

          <p className="mt-3.5 font-body text-sm text-brand-900">
            These stay on this page until you change the password, so you can come back to them.
            Your customer account is untouched — you can still send parcels whenever you want.
          </p>

          <Link to="/login" className="mt-5 inline-block">
            <Button>Go to sign in</Button>
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="max-w-2xl">
      <PageHeader
        eyebrow="Ride with us"
        title="Earn with Deliveroo"
        description="Deliver parcels around Nairobi on your own schedule. Tell us about yourself and operations will review your application."
      />

      {application?.status === 'rejected' && application.review_note && (
        <p className="mt-6 rounded-2xl bg-rose-100 px-5 py-3.5 font-body text-sm text-rose-800">
          Your last application was not accepted: {application.review_note}. You are welcome to
          apply again.
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100 sm:p-8"
      >
        <section className="flex flex-col gap-3.5">
          <h2 className="font-display text-xl font-semibold text-slate-950">About you</h2>

          <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center">
            <Avatar name={values.full_name || user?.name} photo={profilePhoto} size="lg" />
            <div>
              <input
                ref={profileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  pickPhoto(event.target.files?.[0], setProfilePhoto)
                  event.target.value = ''
                }}
              />
              <Button type="button" size="sm" onClick={() => profileInput.current?.click()}>
                {profilePhoto ? 'Change your photo' : 'Add a photo of yourself'}
              </Button>
              <p className="mt-1.5 font-body text-xs text-slate-400">
                Customers see this photo so they know who is at the door.
              </p>
              {errors.profile_photo_url && (
                <p className="mt-1.5 font-body text-sm text-rose-700">{errors.profile_photo_url}</p>
              )}
            </div>
          </div>

          <Input
            label="Full name"
            value={values.full_name}
            onChange={(event) => set({ full_name: event.target.value })}
            error={errors.full_name}
          />
          <Input
            label="Phone number"
            value={values.phone}
            onChange={(event) => set({ phone: event.target.value })}
            error={errors.phone}
            placeholder="0712345678"
            inputMode="tel"
          />
          <Input
            label="Driving licence number"
            value={values.licence_number}
            onChange={(event) => set({ licence_number: event.target.value })}
            error={errors.licence_number}
            placeholder="DL-99182"
          />
        </section>

        <section className="flex flex-col gap-3.5">
          <h2 className="font-display text-xl font-semibold text-slate-950">Your vehicle</h2>

          <Select
            label="What will you ride or drive?"
            value={values.vehicle_type}
            onChange={(event) => set({ vehicle_type: event.target.value })}
            options={vehicleTypes.map((type) => ({ value: type.value, label: type.label }))}
          />

          <fieldset>
            <legend className="font-body text-sm font-semibold text-slate-700">
              Whose vehicle is it?
            </legend>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              <Choice
                active={ownsVehicle}
                title="It is mine"
                detail="You use your own bike, car or van"
                onSelect={() => set({ vehicle_ownership: 'own' })}
              />
              <Choice
                active={!ownsVehicle}
                title="I need one from the company"
                detail="Deliveroo assigns you a vehicle"
                onSelect={() => set({ vehicle_ownership: 'company' })}
              />
            </div>
          </fieldset>

          {ownsVehicle && (
            <>
              <Input
                label="Number plate"
                value={values.vehicle_registration}
                onChange={(event) => set({ vehicle_registration: event.target.value })}
                error={errors.vehicle_registration}
                placeholder="KMFA 883X"
              />

              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                {vehiclePhoto ? (
                  <img
                    src={vehiclePhoto}
                    alt="Your vehicle"
                    className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-inset ring-slate-200"
                  />
                ) : (
                  <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-100 font-body text-xs text-slate-400">
                    No photo
                  </span>
                )}
                <div>
                  <input
                    ref={vehicleInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      pickPhoto(event.target.files?.[0], setVehiclePhoto)
                      event.target.value = ''
                    }}
                  />
                  <Button type="button" size="sm" variant="outline" onClick={() => vehicleInput.current?.click()}>
                    {vehiclePhoto ? 'Change vehicle photo' : 'Add a vehicle photo'}
                  </Button>
                  {errors.vehicle_photo_url && (
                    <p className="mt-1.5 font-body text-sm text-rose-700">
                      {errors.vehicle_photo_url}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </section>

        {submitError && (
          <p className="rounded-xl bg-rose-100 px-3.5 py-2.5 font-body text-sm text-rose-800">
            {submitError}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={submitting}>
            Send my application
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}

function Choice({ active, title, detail, onSelect }) {
  return (
    <label
      className={[
        'flex cursor-pointer items-start gap-2.5 rounded-xl p-3.5 transition',
        'ring-1 ring-inset focus-within:ring-2 focus-within:ring-brand-500',
        active ? 'bg-brand-50 ring-brand-500' : 'bg-white ring-slate-200 hover:ring-slate-300',
      ].join(' ')}
    >
      <input
        type="radio"
        name="vehicle_ownership"
        checked={active}
        onChange={onSelect}
        className="mt-0.5 h-4 w-4 accent-brand-600"
      />
      <span>
        <span className="block font-display text-base font-semibold text-slate-900">{title}</span>
        <span className="block font-body text-sm text-slate-500">{detail}</span>
      </span>
    </label>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3.5">
      <dt className="font-body text-sm text-slate-500">{label}</dt>
      <dd className="font-body text-sm font-medium text-slate-900">{value || '—'}</dd>
    </div>
  )
}