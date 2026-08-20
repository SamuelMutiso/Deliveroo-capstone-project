export const TOKEN_KEY = 'deliveroo.access'
export const REFRESH_KEY = 'deliveroo.refresh'

export function readToken(key = TOKEN_KEY) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeTokens({ access_token: access, refresh_token: refresh }) {
  try {
    if (access) window.localStorage.setItem(TOKEN_KEY, access)
    if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh)
  } catch {
    return
  }
}

export function clearTokens() {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(REFRESH_KEY)
  } catch {
    return
  }
}

export function extractError(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data
  if (!data) {
    return error?.message === 'Network Error'
      ? 'Cannot reach the server. Is the API running?'
      : fallback
  }
  if (data.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors)[0]
    if (Array.isArray(first) && first.length) return first[0]
  }
  return data.message || fallback
}

export function fieldErrors(error) {
  const raw = error?.response?.data?.errors
  if (!raw || typeof raw !== 'object') return {}
  return Object.entries(raw).reduce((acc, [field, messages]) => {
    acc[field] = Array.isArray(messages) ? messages[0] : String(messages)
    return acc
  }, {})
}
