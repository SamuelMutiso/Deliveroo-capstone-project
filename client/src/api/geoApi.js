import axiosClient from './axiosClient'

export const geoApi = {
  search: (q, signal) =>
    axiosClient.get('/geo/search', { params: { q }, signal }).then((r) => r.data),
  reverse: (lat, lng) =>
    axiosClient.get('/geo/reverse', { params: { lat, lng } }).then((r) => r.data),
}
