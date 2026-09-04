import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import AppShell from '@/components/layout/AppShell'
import AppRoutes from '@/routes/AppRoutes'
import Landing from '@/pages/Landing'
import { restoreSession, sessionExpired } from '@/features/auth/authSlice'

export default function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(restoreSession())
  }, [dispatch])

  useEffect(() => {
    const handleSignOut = () => {
      dispatch(sessionExpired())
    }

    window.addEventListener(
      'deliveroo:signed-out',
      handleSignOut
    )

    return () => {
      window.removeEventListener(
        'deliveroo:signed-out',
        handleSignOut
      )
    }
  }, [dispatch])

  return (
    <Routes>
      {/* Landing page has its own marketing navbar + footer */}
      <Route
        path="/"
        element={<Landing />}
      />

      {/* Everything else uses the application shell */}
      <Route
        path="*"
        element={
          <AppShell>
            <AppRoutes />
          </AppShell>
        }
      />
    </Routes>
  )
}