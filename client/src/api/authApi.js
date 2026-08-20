import axiosClient from './axiosClient'

export const authApi = {
  register: (payload) => axiosClient.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => axiosClient.post('/auth/login', payload).then((r) => r.data),
  me: () => axiosClient.get('/auth/me').then((r) => r.data),
  updateProfile: (payload) => axiosClient.patch('/auth/me', payload).then((r) => r.data),
  changePassword: (payload) =>
    axiosClient.post('/auth/change-password', payload).then((r) => r.data),
  logout: () => axiosClient.post('/auth/logout').then((r) => r.data),
}
