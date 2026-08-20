import { Route, Routes } from 'react-router-dom'

import About from '@/pages/About'
import AdminApplications from '@/pages/admin/AdminApplications'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminOrderDetail from '@/pages/admin/AdminOrderDetail'
import AdminOrders from '@/pages/admin/AdminOrders'
import AdminUserDetail from '@/pages/admin/AdminUserDetail'
import AdminUsers from '@/pages/admin/AdminUsers'
import BecomeCourier from '@/pages/customer/BecomeCourier'
import CourierDashboard from '@/pages/courier/CourierDashboard'
import CourierOrderDetail from '@/pages/courier/CourierOrderDetail'
import CustomerDashboard from '@/pages/customer/CustomerDashboard'
import Landing from '@/pages/Landing'
import Login from '@/pages/auth/Login'
import NewOrder from '@/pages/customer/NewOrder'
import NotFound from '@/pages/NotFound'
import OrderDetail from '@/pages/customer/OrderDetail'
import Profile from '@/pages/customer/Profile'
import ProtectedRoute from './ProtectedRoute'
import Register from '@/pages/auth/Register'
import Services from '@/pages/Services'
import RoleRoute from './RoleRoute'
import { ROLES } from '@/utils/constants'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />

        <Route element={<RoleRoute allow={[ROLES.CUSTOMER]} />}>
          <Route path="/dashboard" element={<CustomerDashboard />} />
          <Route path="/orders/new" element={<NewOrder />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/become-a-rider" element={<BecomeCourier />} />
        </Route>

        <Route element={<RoleRoute allow={[ROLES.COURIER]} />}>
          <Route path="/courier" element={<CourierDashboard />} />
          <Route path="/courier/:id" element={<CourierOrderDetail />} />
        </Route>

        <Route element={<RoleRoute allow={[ROLES.ADMIN]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:id" element={<AdminUserDetail />} />
          <Route path="/admin/applications" element={<AdminApplications />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}