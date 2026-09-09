import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { PageSpinner } from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'

const FORCED_PATH = '/set-password'

export default function ProtectedRoute() {
  const { isAuthenticated, isResolving, user } = useAuth()
  const location = useLocation()

  if (isResolving) return <PageSpinner label="Authenticating. Please wait." />

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (user?.must_change_password && location.pathname !== FORCED_PATH) {
    return <Navigate to={FORCED_PATH} replace />
  }

  return <Outlet />
}
