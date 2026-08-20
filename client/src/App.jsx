import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import AppShell from '@/components/layout/AppShell'
import AppRoutes from '@/routes/AppRoutes'
import { restoreSession, sessionExpired } from '@/features/auth/authSlice'

export default function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(restoreSession())
  }, [dispatch])

  useEffect(() => {
    const handleSignOut = () => dispatch(sessionExpired())
    window.addEventListener('deliveroo:signed-out', handleSignOut)
    return () => window.removeEventListener('deliveroo:signed-out', handleSignOut)
  }, [dispatch])

  return (
    <AppShell>
      <AppRoutes />
    </AppShell>
  )
}