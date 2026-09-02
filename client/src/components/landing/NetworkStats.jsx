import { useEffect, useState } from 'react'

import { publicApi } from '@/api/publicApi'

export default function NetworkStats() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let live = true
    publicApi
      .stats()
      .then((data) => {
        if (live) setStats(data)
      })
      .catch(() => setStats(null))
    return () => {
      live = false
    }
  }, [])

  if (!stats || (!stats.delivered && !stats.riders)) return null

  const tiles = [
    { value: stats.delivered.toLocaleString(), label: 'Parcels delivered' },
    { value: stats.riders.toLocaleString(), label: 'Riders on the network' },
    stats.average_minutes && { value: `${stats.average_minutes} min`, label: 'Average delivery' },
    stats.average_rating && {
      value: `${stats.average_rating}/5`,
      label: `Rider rating · ${stats.ratings_count} reviews`,
    },
  ].filter(Boolean)

  return (
    <dl className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label}>
          <dt className="font-display text-4xl font-bold tracking-[-0.05em] text-slate-950 sm:text-5xl">
            {tile.value}
          </dt>
          <dd className="mt-1.5 font-body text-sm text-slate-500">{tile.label}</dd>
        </div>
      ))}
    </dl>
  )
}
