import { useCallback, useEffect, useRef, useState } from 'react'

const MIN_SECONDS_BETWEEN_PUSHES = 15
const MIN_METRES_MOVED = 25

function metresBetween(a, b) {
  const R = 6371000
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Streams the rider's position while sharing is on.
 * Only sends when they have actually moved, so a parked rider does not spam the API.
 */
export function useLiveLocation(onPosition) {
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState(null)
  const watchId = useRef(null)
  const lastSent = useRef({ at: 0, point: null })
  const handler = useRef(onPosition)

  useEffect(() => {
    handler.current = onPosition
  }, [onPosition])

  const stop = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    setSharing(false)
  }, [])

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setError('This browser cannot share your location')
      return
    }
    setError(null)
    setSharing(true)
    lastSent.current = { at: 0, point: null }

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const point = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        }
        const now = Date.now()
        const { at, point: previous } = lastSent.current

        const longEnough = (now - at) / 1000 >= MIN_SECONDS_BETWEEN_PUSHES
        const farEnough = !previous || metresBetween(previous, point) >= MIN_METRES_MOVED

        if (!previous || (longEnough && farEnough)) {
          lastSent.current = { at: now, point }
          handler.current?.(point)
        }
      },
      (positionError) => {
        setError(
          positionError.code === positionError.PERMISSION_DENIED
            ? 'Location permission was refused'
            : 'Could not read your location',
        )
        stop()
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    )
  }, [stop])

  useEffect(() => stop, [stop])

  return { sharing, error, start, stop }
}

export default useLiveLocation
