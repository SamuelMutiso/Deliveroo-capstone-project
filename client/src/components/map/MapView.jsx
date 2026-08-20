import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api'
import { useEffect, useMemo, useState } from 'react'

import { MAP_LIBRARIES, MAPS_API_KEY, NAIROBI_CENTER } from '@/utils/constants'
import Spinner from '@/components/ui/Spinner'

const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f4f7f7' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#57767b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e9edf0' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e9edf0' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#f1efe4' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d7d8' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
]

const OPTIONS = {
  styles: MAP_STYLE,
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: 'cooperative',
  clickableIcons: false,
}

function pin(fill, ring) {
  return {
    path: 'M12 2C7.9 2 4.5 5.3 4.5 9.4 4.5 15 12 22 12 22s7.5-7 7.5-12.6C19.5 5.3 16.1 2 12 2Z',
    fillColor: fill,
    fillOpacity: 1,
    strokeColor: ring,
    strokeWeight: 2,
    scale: 1.5,
    anchor: { x: 12, y: 22 },
  }
}

export default function MapView(props) {
  if (!MAPS_API_KEY) {
    const { height = 'h-[22rem]', pickup, destination, courier } = props
    return <MapFallback height={height} points={{ pickup, destination, courier }} />
  }
  return <LiveMap {...props} />
}

function LiveMap({
  pickup,
  destination,
  courier,
  polyline,
  height = 'h-[22rem]',
  onMapClick,
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'deliveroo-google-maps',
    googleMapsApiKey: MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
  })
  const [map, setMap] = useState(null)

  const points = useMemo(
    () => [pickup, destination, courier].filter((point) => point?.lat && point?.lng),
    [pickup, destination, courier],
  )

  const path = useMemo(() => {
    if (!isLoaded || !polyline || !window.google?.maps?.geometry?.encoding) return null
    try {
      return window.google.maps.geometry.encoding
        .decodePath(polyline)
        .map((point) => ({ lat: point.lat(), lng: point.lng() }))
    } catch {
      return null
    }
  }, [isLoaded, polyline])

  useEffect(() => {
    if (!map || !points.length || !window.google) return
    if (points.length === 1) {
      map.setCenter(points[0])
      map.setZoom(14)
      return
    }
    const bounds = new window.google.maps.LatLngBounds()
    points.forEach((point) => bounds.extend(point))
    map.fitBounds(bounds, { top: 56, bottom: 56, left: 56, right: 56 })
  }, [map, points])

  if (loadError) {
    return (
      <div
        className={`flex ${height} items-center justify-center rounded-2xl bg-red-100 px-6 text-center`}
      >
        <p className="font-body text-sm text-red-700">
          Google Maps could not load. Check that VITE_GOOGLE_MAPS_API_KEY is valid and that the Maps
          JavaScript API is enabled.
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={`flex ${height} items-center justify-center rounded-2xl bg-slate-50`}>
        <Spinner label="Loading map" />
      </div>
    )
  }

  return (
    <div className={`${height} overflow-hidden rounded-2xl ring-1 ring-inset ring-slate-200`}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={points[0] || NAIROBI_CENTER}
        zoom={12}
        options={OPTIONS}
        onLoad={setMap}
        onUnmount={() => setMap(null)}
        onClick={onMapClick ? (event) => onMapClick({ lat: event.latLng.lat(), lng: event.latLng.lng() }) : undefined}
      >
        {pickup?.lat && <Marker position={pickup} icon={pin('#1f2937', '#ffc400')} title="Pickup" zIndex={2} />}
        {destination?.lat && (
          <Marker position={destination} icon={pin('#0d1417', '#ffffff')} title="Destination" zIndex={2} />
        )}
        {courier?.lat && (
          <Marker position={courier} icon={pin('#f2900d', '#ffffff')} title="Courier" zIndex={3} />
        )}
        {path && (
          <Polyline
            path={path}
            options={{ strokeColor: '#9c5f02', strokeOpacity: 0.9, strokeWeight: 4 }}
          />
        )}
        {!path && pickup?.lat && destination?.lat && (
          <Polyline
            path={[pickup, destination]}
            options={{
              strokeColor: '#57767b',
              strokeOpacity: 0,
              strokeWeight: 3,
              icons: [
                {
                  icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.7, scale: 3 },
                  offset: '0',
                  repeat: '14px',
                },
              ],
            }}
          />
        )}
      </GoogleMap>
    </div>
  )
}

function MapFallback({ height, points }) {
  const rows = [
    ['Pickup', points.pickup, 'bg-brand-600'],
    ['Destination', points.destination, 'bg-slate-950'],
    ['Courier', points.courier, 'bg-amber-500'],
  ].filter(([, point]) => point?.lat && point?.lng)

  return (
    <div
      className={`flex ${height} flex-col justify-center gap-3.5 rounded-2xl bg-slate-50 p-6 ring-1 ring-inset ring-slate-200`}
    >
      <p className="font-body text-sm text-slate-500">
        Add VITE_GOOGLE_MAPS_API_KEY to your client .env to see the live map and route.
      </p>
      <dl className="flex flex-col gap-2.5">
        {rows.map(([label, point, tone]) => (
          <div key={label} className="flex items-center gap-2.5">
            <span className={`h-2.5 w-2.5 rounded-full ${tone}`} aria-hidden="true" />
            <dt className="w-28 font-body text-sm font-semibold text-slate-700">{label}</dt>
            <dd className="font-mono text-sm text-slate-500">
              {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}