import { Link } from 'react-router-dom'

import Button from '@/components/ui/Button'
import { PageContainer } from '@/components/layout/AppShell'
import { useAuth } from '@/hooks/useAuth'
import { HOME_BY_ROLE } from '@/utils/constants'

//Added fallback page incase of server error
export default function NotFound() {
  const { isAuthenticated, role } = useAuth()
  const home = isAuthenticated ? HOME_BY_ROLE[role] || '/dashboard' : '/'

  return (
    <PageContainer className="max-w-xl">
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-inset ring-slate-100">
        <p className="font-mono text-sm text-brand-600">404</p>
        <h1 className="mt-2.5 font-display text-3xl font-bold tracking-tight text-slate-950">
          That page took a wrong turn
        </h1>
        <p className="mt-1.5 font-body text-base text-slate-500">
          The address you followed does not exist. Let us get you back on the route.
        </p>
        <div className="mt-8 flex justify-center">
          <Button as={Link} to={home} size="lg" variant="dark">
            Back to previous page?
          </Button>
        </div>
      </div>
    </PageContainer>
  )
}