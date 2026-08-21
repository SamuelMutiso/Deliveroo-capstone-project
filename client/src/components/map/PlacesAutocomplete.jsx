import { useEffect, useId, useRef, useState } from "react";

import Input from "@/components/ui/Input";

const NAIROBI_VIEWBOX = "36.65,-1.15,37.05,-1.45";

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

  /*
   * Keep the input synchronized when the parent changes
   * the selected location externally.
   */
  useEffect(() => {
    if (value?.address !== undefined && value.address !== query) {
      setQuery(value.address || "");
    }
  }, [value?.address]);

  /*
   * Clean up timers and requests when component unmounts.
   */
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

    /*
     * Cancel the previous search request.
     */
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");

      url.searchParams.set("q", trimmed);

      /*
       * Ask Nominatim for proper address information.
       */
      url.searchParams.set("format", "json");

      url.searchParams.set("addressdetails", "1");

      /*
       * Search only inside the Nairobi area.
       */
      url.searchParams.set("viewbox", NAIROBI_VIEWBOX);

      /*
       * Prefer results inside the viewbox.
       */
      url.searchParams.set("bounded", "1");

      /*
       * Return several useful result types:
       * buildings, roads, shops, hospitals,
       * malls, landmarks, etc.
       */
      url.searchParams.set("limit", "8");

      /*
       * Restrict results to Kenya.
       */
      url.searchParams.set("countrycodes", "ke");

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim search failed: ${response.status}`);
      }

      const data = await response.json();

      if (controller.signal.aborted) {
        return;
      }

      console.log("Nominatim suggestions:", data);

      setSuggestions(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      console.error("Location search error:", error);
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

    /*
     * Wait until the user stops typing before searching.
     */
    debounceRef.current = setTimeout(() => {
      searchPlaces(nextQuery);
    }, 500);
  };

  const selectPlace = (place) => {
    if (!place) {
      return;
    }

    const lat = Number(place.lat);
    const lng = Number(place.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      console.error("Invalid location returned:", place);
      return;
    }

    /*
     * Nominatim's display_name is already a nicely
     * formatted address.
     */
    const address = place.display_name || place.name || "";

    const next = {
      address,
      lat,
      lng,
    };

    console.log("Selected location:", next);

    /*
     * Update input immediately.
     */
    setQuery(address);

    /*
     * Close dropdown.
     */
    setSuggestions([]);
    setOpen(false);

    /*
     * Send coordinates to parent.
     *
     * Your Leaflet MapView should receive these
     * coordinates and move the marker.
     */
    onChange(next);
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
          /*
           * Give the suggestion button time to receive
           * the click before closing the dropdown.
           */
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
              <li key={place.place_id}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    /*
                     * Prevent the input's onBlur from
                     * closing the dropdown before selection.
                     */
                    event.preventDefault();
                  }}
                  onClick={() => selectPlace(place)}
                  className="flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left transition hover:bg-brand-50"
                >
                  <span className="font-body text-sm font-medium text-slate-800">
                    {place.name || place.display_name}
                  </span>

                  {place.display_name && (
                    <span className="font-body text-xs text-slate-400">
                      {place.display_name}
                    </span>
                  )}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}