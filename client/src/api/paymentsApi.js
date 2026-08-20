import axiosClient from './axiosClient'

export const paymentsApi = {
  get: (orderId) => axiosClient.get(`/payments/${orderId}`).then((r) => r.data),
  checkout: (orderId, payload) =>
    axiosClient.post(`/payments/${orderId}/mpesa`, payload).then((r) => r.data),
}
