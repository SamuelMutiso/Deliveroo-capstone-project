import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'

import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import { PageContainer, PageHeader } from '@/components/layout/AppShell'
import { PageSpinner } from '@/components/ui/Spinner'
import {
  fetchUsers,
  selectAdminSaveError,
  selectAdminSaving,
  selectAdminUserFilters,
  selectAdminUsers,
  selectAdminUsersError,
  selectAdminUsersMeta,
  selectAdminUsersStatus,
  setAdminUserFilters,
  updateUser,
} from '@/features/admin/adminSlice'
import { ROLES } from '@/utils/constants'
import { fullDate, initials } from '@/utils/formatters'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { useToast } from '@/hooks/useToast'

const ROLE_OPTIONS = [
  { value: '', label: 'Everyone' },
  { value: ROLES.CUSTOMER, label: 'Customers' },
  { value: ROLES.COURIER, label: 'Couriers' },
  { value: ROLES.ADMIN, label: 'Admins' },
]

const ROLE_CHOICES = [
  { value: ROLES.CUSTOMER, label: 'Customer' },
  { value: ROLES.COURIER, label: 'Courier' },
  { value: ROLES.ADMIN, label: 'Admin' },
]

const ROLE_CHIP = {
  customer: 'bg-blue-100 text-blue-700',
  courier: 'bg-brand-100 text-brand-800',
  admin: 'bg-slate-950 text-white',
}

export default function AdminUsers() {
  const dispatch = useDispatch()
  const toast = useToast()
  const { user: me } = useAuth()

  const users = useSelector(selectAdminUsers)
  const meta = useSelector(selectAdminUsersMeta)
  const status = useSelector(selectAdminUsersStatus)
  const error = useSelector(selectAdminUsersError)
  const filters = useSelector(selectAdminUserFilters)
  const saving = useSelector(selectAdminSaving)
  const saveError = useSelector(selectAdminSaveError)

  const [search, setSearch] = useState(filters.search)
  const debouncedSearch = useDebounce(search)
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState({ role: '', is_active: true })

  useEffect(() => {
    dispatch(setAdminUserFilters({ search: debouncedSearch, page: 1 }))
  }, [debouncedSearch, dispatch])

  useEffect(() => {
    dispatch(
      fetchUsers({
        page: filters.page,
        per_page: 10,
        role: filters.role || undefined,
        search: filters.search || undefined,
      }),
    )
  }, [dispatch, filters])

  const openEditor = (person) => {
    setEditing(person)
    setDraft({ role: person.role, is_active: person.is_active })
  }

  const save = async () => {
    const payload = {}
    if (draft.role !== editing.role) payload.role = draft.role
    if (draft.is_active !== editing.is_active) payload.is_active = draft.is_active

    if (!Object.keys(payload).length) {
      setEditing(null)
      return
    }

    const result = await dispatch(updateUser({ id: editing.id, payload }))
    if (updateUser.fulfilled.match(result)) {
      toast.success(`${editing.name} updated`)
      setEditing(null)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Operations"
        title="People"
        description="Everyone with an account. Promote couriers, or deactivate an account that should no longer sign in."
      />

      <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
        <Input
          label="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Name or email"
        />
        <Select
          label="Role"
          value={filters.role}
          onChange={(event) => dispatch(setAdminUserFilters({ role: event.target.value, page: 1 }))}
          options={ROLE_OPTIONS}
        />
      </div>

      <div className="mt-6">
        {status === 'loading' && <PageSpinner label="Loading people" />}

        {status === 'failed' && (
          <ErrorMessage message={error} onRetry={() => dispatch(fetchUsers({ page: 1 }))} />
        )}

        {status === 'ready' && users.length === 0 && (
          <EmptyState icon="search" title="Nobody matched" message="Try a different name or role." />
        )}

        {status === 'ready' && users.length > 0 && (
          <>
            <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {users.map((person) => (
                <li
                  key={person.id}
                  className="flex flex-col gap-3.5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100"
                >
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 font-body text-sm font-bold text-slate-700">
                      {initials(person.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-semibold text-slate-950">
                        {person.name}
                      </p>
                      <p className="truncate font-body text-sm text-slate-500">{person.email}</p>
                      <p className="font-body text-xs text-slate-400">
                        Joined {fullDate(person.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded-full px-3.5 py-0.5 font-body text-xs font-semibold capitalize ${
                        ROLE_CHIP[person.role]
                      }`}
                    >
                      {person.role}
                    </span>
                    <span
                      className={`rounded-full px-3.5 py-0.5 font-body text-xs font-semibold ${
                        person.is_active ? 'bg-brand-100 text-brand-800' : 'bg-red-100 text-red-700'                      }`}
                    >
                      {person.is_active ? 'Active' : 'Deactivated'}
                    </span>
                    {person.vehicle && (
                      <span className="font-mono text-xs text-slate-400">{person.vehicle}</span>
                    )}
                  </div>

                  <div className="flex gap-2.5">
                    <Button as={Link} to={`/admin/users/${person.id}`} size="sm" fullWidth>
                      View details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      fullWidth
                      disabled={person.id === me?.id}
                      onClick={() => openEditor(person)}
                    >
                      {person.id === me?.id ? 'This is you' : 'Manage access'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination
              meta={meta}
              label="people"
              onChange={(page) => dispatch(setAdminUserFilters({ page }))}
            />
          </>
        )}
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Manage ${editing.name}` : ''}
        description="Role changes take effect the next time they sign in."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={save}>
              Save changes
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          {saveError && <ErrorMessage compact message={saveError} />}

          <Select
            label="Role"
            value={draft.role}
            onChange={(event) => setDraft({ ...draft, role: event.target.value })}
            options={ROLE_CHOICES}
          />

          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-slate-50 p-3.5">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })}
              className="mt-0.5 h-4 w-4 accent-brand-600"
            />
            <span>
              <span className="block font-body text-base font-semibold text-slate-900">
                Account is active
              </span>
              <span className="block font-body text-sm text-slate-500">
                Deactivated accounts cannot sign in and cannot be assigned deliveries.
              </span>
            </span>
          </label>
        </div>
      </Modal>
    </PageContainer>
  )
}
