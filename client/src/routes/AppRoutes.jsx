import { Route, Routes } from "react-router-dom";

import About from "@/pages/About";
import AdminApplications from "@/pages/admin/AdminApplications";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminOrderDetail from "@/pages/admin/AdminOrderDetail";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminUserDetail from "@/pages/admin/AdminUserDetail";
import AdminUsers from "@/pages/admin/AdminUsers";
import BecomeCourier from "@/pages/customer/BecomeCourier";
import CourierDashboard from "@/pages/courier/CourierDashboard";
import CourierOrderDetail from "@/pages/courier/CourierOrderDetail";
import CustomerDashboard from "@/pages/customer/CustomerDashboard";
import Login from "@/pages/auth/Login";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import NewOrder from "@/pages/customer/NewOrder";
import NotFound from "@/pages/NotFound";
import OrderDetail from "@/pages/customer/OrderDetail";
import OrderReceipt from "@/pages/customer/OrderReceipt";
import Privacy from "@/pages/Privacy";
import Profile from "@/pages/customer/Profile";
import Register from "@/pages/auth/Register";
import ResetPassword from "@/pages/auth/ResetPassword";
import Services from "@/pages/Services";
import Terms from "@/pages/Terms";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import VerifyReceipt from "@/pages/VerifyReceipt";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import { ROLES } from "@/utils/constants";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/verify" element={<VerifyReceipt />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />

      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />

        <Route element={<RoleRoute allow={[ROLES.CUSTOMER]} />}>
          <Route path="/dashboard" element={<CustomerDashboard />} />

          <Route path="/orders/new" element={<NewOrder />} />

          <Route path="/orders/:id" element={<OrderDetail />} />

          <Route path="/orders/:id/receipt" element={<OrderReceipt />} />

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