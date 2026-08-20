import { Navigate, Outlet } from 'react-router-dom'

import { PageSpinner } from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'
import { HOME_BY_ROLE } from '@/utils/constants'

export default function RoleRoute({ allow = [] }) {
  const { role, isAuthenticated, isResolving } = useAuth()

  if (isResolving) return <PageSpinner label="Checking your access" />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (!allow.includes(role)) {
    return <Navigate to={HOME_BY_ROLE[role] || '/'} replace />
  }

  return <Outlet />
}
