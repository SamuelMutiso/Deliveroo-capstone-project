import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import { useEffect, useMemo, useState } from "react";

import "leaflet/dist/leaflet.css";

import Spinner from "@/components/ui/Spinner";
import { NAIROBI_CENTER } from "@/utils/constants";

const ROUTING_PROFILE = "driving";

const ROUTING_URL = "https://router.project-osrm.org/route/v1";

const DEFAULT_ZOOM = 12;

const ROUTE_COLOR = "#9c5f02";

const NAIROBI_BOUNDS = [
  [-1.45, 36.65],
  [-1.15, 37.05],
];

{/*
 * Create custom pin icons.
 */}
function createPinIcon(fill, ring) {
  return L.divIcon({
    className: "",
    html: `
      <div
        style="
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          background: ${fill};
          border: 3px solid ${ring};
          transform: rotate(-45deg);
          box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        "
      ></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

const pickupIcon = createPinIcon("#1f2937", "#ffc400");

const destinationIcon = createPinIcon("#0d1417", "#ffffff");

const courierIcon = createPinIcon("#f2900d", "#ffffff");

/*
 * Small component that gives us access to the Leaflet map instance.
 */
function MapController({ pickup, destination, courier, routeCoordinates }) {
  const map = useMap();

  useEffect(() => {
    const points = [];

    if (pickup?.lat != null && pickup?.lng != null) {
      points.push([pickup.lat, pickup.lng]);
    }

    if (destination?.lat != null && destination?.lng != null) {
      points.push([destination.lat, destination.lng]);
    }

    if (courier?.lat != null && courier?.lng != null) {
      points.push([courier.lat, courier.lng]);
    }

    /*
     * Prefer fitting the actual road route.
     */
    if (routeCoordinates.length > 1) {
      const bounds = L.latLngBounds(routeCoordinates);

      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
        duration: 0.8,
      });

      return;
    }

    /*
     * If there is no route yet, fit the selected points.
     */
    if (points.length > 1) {
      const bounds = L.latLngBounds(points);

      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
        duration: 0.8,
      });

      return;
    }

    /*
     * One point.
     */
    if (points.length === 1) {
      map.flyTo(points[0], 14, {
        duration: 0.8,
      });

      return;
    }

    /*
     * Nothing selected.
     */
    map.flyTo([NAIROBI_CENTER.lat, NAIROBI_CENTER.lng], DEFAULT_ZOOM, {
      duration: 0.8,
    });
  }, [map, pickup, destination, courier, routeCoordinates]);

  return null;
}

/*
 * Calls OSRM and retrieves the actual road geometry.
 */
async function getRoute(pickup, destination, signal) {
  if (
    pickup?.lat == null ||
    pickup?.lng == null ||
    destination?.lat == null ||
    destination?.lng == null
  ) {
    return null;
  }

  const coordinates = [
    `${pickup.lng},${pickup.lat}`,
    `${destination.lng},${destination.lat}`,
  ].join(";");

  const url =
    `${ROUTING_URL}/${ROUTING_PROFILE}/${coordinates}` +
    `?overview=full&geometries=geojson&steps=false`;

  const response = await fetch(url, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`OSRM routing failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.code !== "Ok") {
    throw new Error(data.message || "No route found");
  }

  const route = data.routes?.[0];

  if (!route?.geometry?.coordinates) {
    throw new Error("OSRM returned no route geometry");
  }

  /*
   * OSRM returns:
   *
   * [lng, lat]
   *
   * Leaflet expects:
   *
   * [lat, lng]
   */
  return route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
}

/*
 * Main MapView component.
 */
export default function MapView({
  pickup,
  destination,
  courier,
  height = "h-[22rem]",
  onMapClick,
}) {
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  const [routeLoading, setRouteLoading] = useState(false);

  const [routeError, setRouteError] = useState("");

  /*
   * Fetch a new route whenever pickup/destination changes.
   */
  useEffect(() => {
    if (
      pickup?.lat == null ||
      pickup?.lng == null ||
      destination?.lat == null ||
      destination?.lng == null
    ) {
      setRouteCoordinates([]);
      setRouteError("");
      setRouteLoading(false);

      return;
    }

    const controller = new AbortController();

    const calculateRoute = async () => {
      setRouteLoading(true);
      setRouteError("");

      try {
        const coordinates = await getRoute(
          pickup,
          destination,
          controller.signal,
        );

        if (controller.signal.aborted) {
          return;
        }

        setRouteCoordinates(coordinates || []);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("Route calculation error:", error);

        setRouteCoordinates([]);

        setRouteError("We couldn't calculate the road route.");
      } finally {
        if (!controller.signal.aborted) {
          setRouteLoading(false);
        }
      }
    };

    calculateRoute();

    return () => {
      controller.abort();
    };
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng]);

  /*
   * Memoized map center.
   */
  const center = useMemo(() => [NAIROBI_CENTER.lat, NAIROBI_CENTER.lng], []);

  /*
   * Convert route into a slightly wider underlay.
   *
   * This gives the route a polished "layered" appearance.
   */
  const routeUnderlay = useMemo(() => routeCoordinates, [routeCoordinates]);

  return (
    <div
      className={`relative ${height} overflow-hidden rounded-2xl ring-1 ring-inset ring-slate-200`}
    >
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        minZoom={11}
        maxZoom={18}
        maxBounds={NAIROBI_BOUNDS}
        maxBoundsViscosity={0.8}
        scrollWheelZoom={true}
        className="h-full w-full"
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        /* * Pickup marker. */
        {pickup?.lat != null && pickup?.lng != null && (
          <Marker
            position={[pickup.lat, pickup.lng]}
            icon={pickupIcon}
            title="Pickup"
          />
        )}
        /* * Destination marker. */
        {destination?.lat != null && destination?.lng != null && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={destinationIcon}
            title="Destination"
          />
        )}
        /* * Courier marker. */
        {courier?.lat != null && courier?.lng != null && (
          <Marker
            position={[courier.lat, courier.lng]}
            icon={courierIcon}
            title="Courier"
          />
        )}
        /* * Route shadow / underlay. * * The darker, wider line underneath
        makes the * main route look more polished. */
        {routeUnderlay.length > 1 && (
          <Polyline
            positions={routeUnderlay}
            pathOptions={{
              color: "#ffffff",
              weight: 9,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}
        /* * Main route. */
        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: ROUTE_COLOR,
              weight: 5,
              opacity: 0.95,
              lineCap: "round",
              lineJoin: "round",
              dashArray: "1 10",
              dashOffset: "0",
            }}
          />
        )}
        <MapController
          pickup={pickup}
          destination={destination}
          courier={courier}
          routeCoordinates={routeCoordinates}
        />
        /* * Clicking anywhere on the map returns coordinates * to the parent
        component. */
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
      </MapContainer>
      /* * Route calculation indicator. */
      {routeLoading && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-[1000] -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-xs font-medium text-slate-600 shadow-lg ring-1 ring-slate-200">
            <Spinner label="Calculating route" />
          </div>
        </div>
      )}
      /* * Route error. */
      {!routeLoading && routeError && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2">
          <div className="rounded-full bg-white/95 px-4 py-2 text-xs font-medium text-red-600 shadow-lg ring-1 ring-red-100">
            {routeError}
          </div>
        </div>
      )}
    </div>
  );
}

/*
 * Separate component for map click handling.
 */
function MapClickHandler({ onMapClick }) {
  const map = useMap();

  useEffect(() => {
    const handleClick = (event) => {
      onMapClick({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
    };
  }, [map, onMapClick]);

  return null;
}
