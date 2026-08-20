import { format, formatDistanceToNowStrict, parseISO } from 'date-fns'

const currency = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
})

export function money(value) {
  if (value === null || value === undefined) return '—'
  return currency.format(value)
}

export function toDate(value) {
  if (!value) return null
  const parsed = typeof value === 'string' ? parseISO(value) : value
  return Number.isNaN(parsed?.getTime?.()) ? null : parsed
}

export function shortDate(value) {
  const date = toDate(value)
  return date ? format(date, 'd MMM') : '—'
}

export function fullDate(value) {
  const date = toDate(value)
  return date ? format(date, "d MMM yyyy 'at' HH:mm") : '—'
}

export function clockTime(value) {
  const date = toDate(value)
  return date ? format(date, 'HH:mm') : '—'
}

export function relativeTime(value) {
  const date = toDate(value)
  if (!date) return '—'
  return `${formatDistanceToNowStrict(date)} ago`
}

export function distance(km) {
  if (km === null || km === undefined) return '—'
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

export function duration(minutes) {
  if (!minutes && minutes !== 0) return '—'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

export function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function titleCase(value) {
  if (!value) return ''
  return value.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}

export function arrivalBy(minutes) {
  const mins = Number(minutes)
  if (!mins || Number.isNaN(mins)) return null
  const at = new Date(Date.now() + mins * 60000)
  return at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
