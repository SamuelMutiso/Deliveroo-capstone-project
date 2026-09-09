import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

export const publicApi = {
  stats: () => client.get('/public/stats').then((r) => r.data),
  categories: () => client.get('/public/categories').then((r) => r.data),
  places: (q, signal) => client.get('/public/places', { params: { q }, signal }).then((r) => r.data),
  quote: (payload) => client.post('/public/quote', payload).then((r) => r.data),
  track: (code) => client.get(`/public/track/${encodeURIComponent(code)}`).then((r) => r.data),
}
