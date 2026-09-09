import { useEffect, useId, useRef, useState } from "react";

import Input from "@/components/ui/Input";
import { geoApi } from "@/api/geoApi";

export default function PlacesAutocomplete({
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
}) {
  const [query, setQuery] = useState(value?.address || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const inputId = useId();
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (value?.address === undefined) return;
    setQuery((current) =>
      value.address !== current ? value.address || "" : current,
    );
  }, [value?.address]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      abortRef.current?.abort();
    };
  }, []);

  const searchPlaces = async (searchQuery) => {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    try {
      const data = await geoApi.search(trimmed, controller.signal);

      if (controller.signal.aborted) {
        return;
      }

      setSuggestions(Array.isArray(data.results) ? data.results : []);
    } catch (error) {
      if (error.name === "AbortError" || error.code === "ERR_CANCELED") {
        return;
      }

      setSuggestions([]);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleChange = (event) => {
    const nextQuery = event.target.value;

    setQuery(nextQuery);
    setOpen(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!nextQuery.trim()) {
      abortRef.current?.abort();

      setSuggestions([]);
      setLoading(false);

      onChange(null);

      return;
    }

    debounceRef.current = setTimeout(() => {
      searchPlaces(nextQuery);
    }, 500);
  };

  const selectPlace = (place) => {
    if (!place) {
      return;
    }

    const lat = Number(place.lat);
    const lng = Number(place.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    const address = place.address || "";

    setQuery(address);

    setSuggestions([]);
    setOpen(false);

    onChange({ address, lat, lng });
  };

  return (
    <div className="relative">
      <Input
        id={inputId}
        label={label}
        value={query}
        onChange={handleChange}
        onFocus={() => {
          if (suggestions.length > 0) {
            setOpen(true);
          }
        }}
        onBlur={() => {
          window.setTimeout(() => {
            setOpen(false);
          }, 200);
        }}
        placeholder={placeholder || "Start typing an address"}
        error={error}
        hint={
          hint ||
          (value?.lat !== undefined && value?.lng !== undefined
            ? `Pinned at ${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}`
            : undefined)
        }
        autoComplete="off"
      />

      {open && (loading || suggestions.length > 0) && (
        <ul className="absolute inset-x-0 top-[4.75rem] z-30 max-h-72 overflow-y-auto rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-inset ring-slate-200">
          {loading && (
            <li className="px-3.5 py-3 text-sm text-slate-500">
              Searching Nairobi...
            </li>
          )}

          {!loading &&
            suggestions.map((place) => (
              <li key={`${place.lat},${place.lng},${place.address}`}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => selectPlace(place)}
                  className="flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left transition hover:bg-brand-50"
                >
                  <span className="font-body text-sm font-medium text-slate-800">
                    {place.address.split(",")[0]}
                  </span>

                  <span className="font-body text-xs text-slate-400">
                    {place.address}
                  </span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}