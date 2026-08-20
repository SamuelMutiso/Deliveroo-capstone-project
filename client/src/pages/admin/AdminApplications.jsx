import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'

import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import { PageContainer, PageHeader } from '@/components/layout/AppShell'
import {
  approveApplication,
  clearCredentials,
  fetchApplications,
  rejectApplication,
  selectAdminSaving,
  selectApplicationFilter,
  selectApplications,
  selectApplicationsError,
  selectApplicationsStatus,
  selectLastCredentials,
  setApplicationFilter,
} from '@/features/admin/adminSlice'
import { fullDate } from '@/utils/formatters'
import { useLivePoll } from '@/hooks/useLivePoll'
import { useToast } from '@/hooks/useToast'

const FILTERS = [
  { value: 'pending', label: 'Waiting for review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'Everything' },
]

export default function AdminApplications() {
  const dispatch = useDispatch()
  const toast = useToast()

  const applications = useSelector(selectApplications)
  const status = useSelector(selectApplicationsStatus)
  const error = useSelector(selectApplicationsError)
  const filter = useSelector(selectApplicationFilter)
  const saving = useSelector(selectAdminSaving)
  const credentials = useSelector(selectLastCredentials)

  const [rejecting, setRejecting] = useState(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    dispatch(fetchApplications(filter))
  }, [dispatch, filter])

  useLivePoll(() => dispatch(fetchApplications(filter)), { enabled: filter === 'pending' })

  const approve = async (application) => {
    const result = await dispatch(approveApplication({ id: application.id, note: null }))
    if (approveApplication.fulfilled.match(result)) {
      toast.success(`${application.full_name} is now a rider`)
    } else {
      toast.error(result.payload || 'Could not approve that application')
    }
  }

  const reject = async () => {
    const result = await dispatch(rejectApplication({ id: rejecting.id, note: note.trim() || null }))
    setRejecting(null)
    setNote('')
    if (rejectApplication.fulfilled.match(result)) {
      toast.success('Application rejected')
    } else {
      toast.error(result.payload || 'Could not reject that application')
    }
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Operations"
        title="Rider applications"
        description="Approve an applicant and the system issues them a company sign-in. They keep their customer account."
      />

      <div className="mt-6 max-w-xs">
        <Select
          label="Show"
          value={filter}
          onChange={(event) => dispatch(setApplicationFilter(event.target.value))}
          options={FILTERS}
        />
      </div>

      {error && (
        <div className="mt-6">
          <ErrorMessage message={error} />
        </div>
      )}

      {status === 'loading' && applications.length === 0 ? (
        <div className="mt-10 flex justify-center">
          <Spinner />
        </div>
      ) : applications.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Nothing to review"
            message="New rider applications land here as soon as a customer applies."
          />
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3.5">
          {applications.map((application) => (
            <li
              key={application.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-inset ring-slate-100 sm:p-6"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-3.5">
                  <Avatar
                    name={application.full_name}
                    photo={application.profile_photo_url}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold text-slate-950">
                      {application.full_name}
                    </p>
                    <p className="font-body text-sm text-slate-500">
                      {application.vehicle_label} · licence{' '}
                      <span className="font-mono">{application.licence_number}</span>
                    </p>
                    <p className="font-body text-sm text-slate-500">
                      {application.phone} · applies from{' '}
                      {application.applicant?.email}
                    </p>
                    <p className="mt-1 font-body text-xs text-slate-400">
                      Applied {fullDate(application.created_at)}
                    </p>
                    {application.company_email && (
                      <p className="mt-2 font-mono text-xs text-brand-800">
                        Rider login {application.company_email}
                      </p>
                    )}
                    {application.review_note && (
                      <p className="mt-2 font-body text-sm text-slate-500">
                        Note: {application.review_note}
                      </p>
                    )}
                  </div>
                </div>

                {application.vehicle_photo_url && (
                  <img
                    src={application.vehicle_photo_url}
                    alt={`${application.full_name}'s vehicle`}
                    className="h-28 w-full rounded-2xl object-cover ring-1 ring-inset ring-slate-200 sm:w-40 lg:w-44"
                  />
                )}
              </div>

              {application.status === 'pending' && (
                <div className="mt-5 flex flex-wrap gap-2.5 border-t border-slate-100 pt-5">
                  <Button disabled={saving} onClick={() => approve(application)}>
                    Approve and issue a login
                  </Button>
                  <Button
                    variant="outline"
                    disabled={saving}
                    onClick={() => setRejecting(application)}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(credentials)}
        title="Rider account created"
        onClose={() => dispatch(clearCredentials())}
        footer={<Button onClick={() => dispatch(clearCredentials())}>Done</Button>}
      >
        <p className="font-body text-sm text-slate-600">
          These details were emailed to the rider&apos;s personal address. Write them down now —
          the password is not shown again.
        </p>
        <dl className="mt-3.5 rounded-xl bg-slate-100 p-3.5">
          <div className="flex items-baseline justify-between gap-3.5">
            <dt className="font-body text-sm text-slate-500">Sign-in</dt>
            <dd className="font-mono text-sm text-slate-900">{credentials?.email}</dd>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-3.5">
            <dt className="font-body text-sm text-slate-500">Temporary password</dt>
            <dd className="font-mono text-sm text-slate-900">{credentials?.password}</dd>
          </div>
        </dl>
      </Modal>

      <Modal
        open={Boolean(rejecting)}
        title={`Reject ${rejecting?.full_name ?? ''}?`}
        onClose={() => setRejecting(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Keep it open
            </Button>
            <Button variant="danger" loading={saving} onClick={reject}>
              Reject application
            </Button>
          </>
        }
      >
        <Input
          as="textarea"
          label="Reason"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Licence has expired, vehicle photo unclear…"
          hint="The applicant sees this, so keep it useful."
        />
      </Modal>
    </PageContainer>
  )
}
