import axiosClient from './axiosClient'

export const ordersApi = {
  categories: () => axiosClient.get('/orders/categories').then((r) => r.data),
  couriers: () => axiosClient.get('/orders/couriers').then((r) => r.data),
  quote: (payload) => axiosClient.post('/orders/quote', payload).then((r) => r.data),
  list: (params) => axiosClient.get('/orders', { params }).then((r) => r.data),
  create: (payload) => axiosClient.post('/orders', payload).then((r) => r.data),
  detail: (id) => axiosClient.get(`/orders/${id}`).then((r) => r.data),
  events: (id) => axiosClient.get(`/orders/${id}/events`).then((r) => r.data),
  changeDestination: (id, payload) =>
    axiosClient.patch(`/orders/${id}/destination`, payload).then((r) => r.data),
  cancel: (id) => axiosClient.patch(`/orders/${id}/cancel`).then((r) => r.data),
  rate: (id, payload) => axiosClient.post(`/orders/${id}/rating`, payload).then((r) => r.data),
}

export const courierApi = {
  list: (params) => axiosClient.get('/courier/orders', { params }).then((r) => r.data),
  detail: (id) => axiosClient.get(`/courier/orders/${id}`).then((r) => r.data),
  advance: (id, payload) =>
    axiosClient.patch(`/courier/orders/${id}/status`, payload).then((r) => r.data),
  pushLocation: (id, payload) =>
    axiosClient.patch(`/courier/orders/${id}/location`, payload).then((r) => r.data),
  setAvailability: (isAvailable) =>
    axiosClient
      .patch('/courier/availability', { is_available: isAvailable })
      .then((r) => r.data),
  stats: () => axiosClient.get('/courier/stats').then((r) => r.data),
}
