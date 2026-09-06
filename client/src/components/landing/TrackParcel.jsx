import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

import Button from '@/components/ui/Button'

export default function TrackParcel() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')

  const track = (event) => {
    event.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed) navigate(`/track/${encodeURIComponent(trimmed)}`)
  }

  return (
    <div>
      <form onSubmit={track} className="flex flex-col gap-2.5 sm:flex-row">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Enter your tracking code"
          aria-label="Tracking code"
          className="w-full rounded-full bg-white/10 px-5 py-3 font-mono text-base uppercase text-white placeholder:normal-case placeholder:font-body ring-1 ring-inset ring-white/20 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <Button type="submit" size="lg" className="shrink-0">
          Track it
        </Button>
      </form>

      <p className="mt-3.5 font-body text-sm text-white/40">
        Opens a page showing where the parcel has got to. Addresses and contact details stay
        private.
      </p>
    </div>
  )
}
