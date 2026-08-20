import { useSelector } from 'react-redux'

import {
  selectAuthStatus,
  selectAuthSubmitting,
  selectRole,
  selectUser,
} from '@/features/auth/authSlice'
import { ROLES } from '@/utils/constants'

export function useAuth() {
  const user = useSelector(selectUser)
  const role = useSelector(selectRole)
  const status = useSelector(selectAuthStatus)
  const submitting = useSelector(selectAuthSubmitting)

  return {
    user,
    role,
    status,
    submitting,
    isAuthenticated: status === 'authenticated' && Boolean(user),
    isResolving: status === 'loading',
    isCustomer: role === ROLES.CUSTOMER,
    isCourier: role === ROLES.COURIER,
    isAdmin: role === ROLES.ADMIN,
  }
}