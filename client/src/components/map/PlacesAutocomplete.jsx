import { Autocomplete, useJsApiLoader } from '@react-google-maps/api'
import { useId, useMemo, useRef, useState } from 'react'

import Input from '@/components/ui/Input'
import { MAP_LIBRARIES, MAPS_API_KEY, NAIROBI_PLACES } from '@/utils/constants'

const KENYA_BOUNDS = {
  north: 5.02,
  south: -4.72,
  west: 33.9,
  east: 41.92,
}

export default function PlacesAutocomplete(props) {
  if (!MAPS_API_KEY) return <LandmarkPicker {...props} />
  return <PlacesField {...props} />
}

function PlacesField({ label, value, onChange, error, hint, placeholder }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'deliveroo-google-maps',
    googleMapsApiKey: MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
  })
  const [text, setText] = useState(value?.address || '')
  const widget = useRef(null)
  const inputId = useId()

  const handlePlaceChanged = () => {
    const place = widget.current?.getPlace()
    if (!place?.geometry?.location) return

    const next = {
      address: place.formatted_address || place.name || text,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    }
    setText(next.address)
    onChange(next)
  }

  const handleManualEntry = (event) => {
    setText(event.target.value)
    if (!event.target.value) onChange(null)
  }

  if (loadError) {
    return (
      <LandmarkPicker
        label={label}
        value={value}
        onChange={onChange}
        error={error}
        hint="Google Places is unavailable, so pick from the list below."
      />
    )
  }

  if (!isLoaded) {
    return (
      <LandmarkPicker
        label={label}
        value={value}
        onChange={onChange}
        error={error}
        hint="Loading address search…"
      />
    )
  }

  return (
    <Autocomplete
      onLoad={(instance) => {
        widget.current = instance
        instance.setFields(['formatted_address', 'geometry.location', 'name'])
        instance.setBounds(KENYA_BOUNDS)
        instance.setOptions({ strictBounds: false, componentRestrictions: { country: 'ke' } })
      }}
      onPlaceChanged={handlePlaceChanged}
    >
      <Input
        id={inputId}
        label={label}
        value={text}
        onChange={handleManualEntry}
        placeholder={placeholder || 'Start typing an address'}
        error={error}
        hint={hint || (value?.lat ? `Pinned at ${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}` : undefined)}
        autoComplete="off"
      />
    </Autocomplete>
  )
}

function LandmarkPicker({ label, value, onChange, error, hint, placeholder }) {
  const [query, setQuery] = useState(value?.address || '')
  const [browsing, setBrowsing] = useState(false)
  const inputId = useId()

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return NAIROBI_PLACES.slice(0, 6)
    return NAIROBI_PLACES.filter((place) => place.name.toLowerCase().includes(needle)).slice(0, 6)
  }, [query])

  const choose = (place) => {
    setQuery(place.name)
    setBrowsing(false)
    onChange({ address: place.name, lat: place.lat, lng: place.lng })
  }

  return (
    <div className="relative">
      <Input
        id={inputId}
        label={label}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setBrowsing(true)
          if (!event.target.value) onChange(null)
        }}
        onFocus={() => setBrowsing(true)}
        onBlur={() => window.setTimeout(() => setBrowsing(false), 160)}
        placeholder={placeholder || 'Sarit Centre, Westlands'}
        error={error}
        hint={
          hint ||
          (value?.lat
            ? `Pinned at ${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}`
            : 'Start typing, then pick a pickup point from the list')
        }
        autoComplete="off"
      />

      {browsing && matches.length > 0 && (
        <ul className="absolute inset-x-0 top-[4.75rem] z-20 max-h-64 overflow-y-auto rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-inset ring-slate-200">
          {matches.map((place) => (
            <li key={place.name}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(place)}
                className="flex w-full items-center justify-between gap-3.5 px-3.5 py-2.5 text-left transition hover:bg-brand-50"
              >
                <span className="font-body text-sm text-slate-800">{place.name}</span>
                <span className="shrink-0 font-mono text-xs text-slate-400">
                  {place.lat.toFixed(3)}, {place.lng.toFixed(3)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}