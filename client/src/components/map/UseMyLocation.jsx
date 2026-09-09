import { useState } from 'react'
import { Crosshair } from 'lucide-react'

import Button from '@/components/ui/Button'
import { geoApi } from '@/api/geoApi'
import { useToast } from '@/hooks/useToast'

export default function UseMyLocation({ onPick, label = 'Use my current location' }) {
  const toast = useToast()
  const [locating, setLocating] = useState(false)

  const locate = () => {
    if (!navigator.geolocation) {
      toast.error('This browser cannot share your location')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const lat = Number(coords.latitude.toFixed(6))
        const lng = Number(coords.longitude.toFixed(6))

        try {
          const place = await geoApi.reverse(lat, lng)
          onPick({ address: place.address, lat: place.lat ?? lat, lng: place.lng ?? lng })
          toast.success('Pickup set to where you are')
        } catch {
          onPick({ address: `${lat}, ${lng}`, lat, lng })
          toast.success('Pickup set to your coordinates')
        } finally {
          setLocating(false)
        }
      },
      () => {
        setLocating(false)
        toast.error('Could not read your location. Allow access, or type the address instead.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="-mt-1">
      <Button type="button" variant="outline" size="sm" loading={locating} onClick={locate}>
        <Crosshair className="h-4 w-4" aria-hidden="true" />
        {label}
      </Button>
      <p className="mt-1.5 font-body text-xs text-slate-400">
        Drops an exact pin where you are standing so the rider finds you, not just the street.
      </p>
    </div>
  )
}
