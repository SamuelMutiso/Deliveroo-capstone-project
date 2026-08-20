import axiosClient from './axiosClient'

export const adminApi = {
  orders: (params) => axiosClient.get('/admin/orders', { params }).then((r) => r.data),
  order: (id) => axiosClient.get(`/admin/orders/${id}`).then((r) => r.data),
  setStatus: (id, payload) =>
    axiosClient.patch(`/admin/orders/${id}/status`, payload).then((r) => r.data),
  setLocation: (id, payload) =>
    axiosClient.patch(`/admin/orders/${id}/location`, payload).then((r) => r.data),
  assign: (id, payload) => axiosClient.patch(`/admin/orders/${id}/assign`, payload).then((r) => r.data),
  couriers: () => axiosClient.get('/admin/couriers').then((r) => r.data),
  users: (params) => axiosClient.get('/admin/users', { params }).then((r) => r.data),
  user: (id) => axiosClient.get(`/admin/users/${id}`).then((r) => r.data),
  updateUser: (id, payload) => axiosClient.patch(`/admin/users/${id}`, payload).then((r) => r.data),
  applications: (params) =>
    axiosClient.get('/admin/courier-applications', { params }).then((r) => r.data),
  approveApplication: (id, payload) =>
    axiosClient
      .patch(`/admin/courier-applications/${id}/approve`, payload)
      .then((r) => r.data),
  rejectApplication: (id, payload) =>
    axiosClient
      .patch(`/admin/courier-applications/${id}/reject`, payload)
      .then((r) => r.data),
  stats: () => axiosClient.get('/admin/stats').then((r) => r.data),
}
