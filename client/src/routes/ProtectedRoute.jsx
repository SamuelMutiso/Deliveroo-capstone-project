import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { PageSpinner } from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'

export default function ProtectedRoute() {
  const { isAuthenticated, isResolving } = useAuth()
  const location = useLocation()

  if (isResolving) return <PageSpinner label="Authnentication. Please wait." />

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}