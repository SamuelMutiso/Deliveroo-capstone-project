import { useEffect, useRef, useState } from 'react'

import { publicApi } from '@/api/publicApi'

export default function PlaceField({ label, value, onChange, placeholder }) {
  const [query, setQuery] = useState(value?.address || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const debounce = useRef(null)
  const abort = useRef(null)

  useEffect(() => {
    return () => {
      if (debounce.current) clearTimeout(debounce.current)
      abort.current?.abort()
    }
  }, [])

  const search = async (text) => {
    abort.current?.abort()
    const controller = new AbortController()
    abort.current = controller

    try {
      const data = await publicApi.places(text, controller.signal)
      if (!controller.signal.aborted) setResults(data.results || [])
    } catch {
      setResults([])
    }
  }

  const handleChange = (event) => {
    const next = event.target.value
    setQuery(next)
    setOpen(true)
    onChange(null)

    if (debounce.current) clearTimeout(debounce.current)
    if (next.trim().length < 3) {
      setResults([])
      return
    }
    debounce.current = setTimeout(() => search(next), 450)
  }

  const pick = (place) => {
    setQuery(place.address)
    setResults([])
    setOpen(false)
    onChange(place)
  }

  return (
    <div className="relative">
      <label className="font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-700">
        {label}
      </label>
      <input
        value={query}
        onChange={handleChange}
        onBlur={() => window.setTimeout(() => setOpen(false), 180)}
        placeholder={placeholder}
        autoComplete="off"
        className="mt-1.5 w-full rounded-xl bg-white px-3.5 py-2.5 font-body text-base text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />

      {open && results.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-56 overflow-y-auto rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-inset ring-slate-200">
          {results.map((place) => (
            <li key={`${place.lat},${place.lng}`}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(place)}
                className="flex w-full flex-col gap-0.5 px-3.5 py-2 text-left transition hover:bg-brand-50"
              >
                <span className="font-body text-sm font-medium text-slate-800">
                  {place.address.split(',')[0]}
                </span>
                <span className="line-clamp-1 font-body text-xs text-slate-400">
                  {place.address}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
