import axios from 'axios'

import { REFRESH_KEY, TOKEN_KEY, clearTokens, readToken } from '@/utils/http'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const axiosClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

axiosClient.interceptors.request.use((config) => {
  const token = readToken(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing = null

async function refreshAccessToken() {
  const refreshToken = readToken(REFRESH_KEY)
  if (!refreshToken) return null

  const response = await axios.post(
    `${baseURL}/auth/refresh`,
    {},
    { headers: { Authorization: `Bearer ${refreshToken}` } },
  )
  const token = response.data.access_token
  window.localStorage.setItem(TOKEN_KEY, token)
  return token
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const isAuthCall = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh')

    if (status === 401 && !original?._retried && !isAuthCall) {
      original._retried = true
      try {
        refreshing = refreshing || refreshAccessToken()
        const token = await refreshing
        refreshing = null
        if (token) {
          original.headers.Authorization = `Bearer ${token}`
          return axiosClient(original)
        }
      } catch {
        refreshing = null
      }
      clearTokens()
      window.dispatchEvent(new CustomEvent('deliveroo:signed-out'))
    }

    return Promise.reject(error)
  },
)

export default axiosClient
