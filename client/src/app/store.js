import { configureStore } from '@reduxjs/toolkit'

import adminReducer from '@/features/admin/adminSlice'
import applicationsReducer from '@/features/applications/applicationsSlice'
import authReducer from '@/features/auth/authSlice'
import couriersReducer from '@/features/couriers/couriersSlice'
import notificationsReducer from '@/features/notifications/notificationsSlice'
import ordersReducer from '@/features/orders/ordersSlice'
import paymentsReducer from '@/features/payments/paymentsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: ordersReducer,
    couriers: couriersReducer,
    admin: adminReducer,
    payments: paymentsReducer,
    applications: applicationsReducer,
    notifications: notificationsReducer,
  },
})
