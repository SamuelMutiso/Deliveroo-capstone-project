import axiosClient from './axiosClient'

export const applicationsApi = {
  vehicleTypes: () =>
    axiosClient.get('/courier-applications/vehicle-types').then((r) => r.data),
  mine: () => axiosClient.get('/courier-applications/mine').then((r) => r.data),
  apply: (payload) => axiosClient.post('/courier-applications', payload).then((r) => r.data),
  withdraw: (id) => axiosClient.delete(`/courier-applications/${id}`).then((r) => r.data),
}
