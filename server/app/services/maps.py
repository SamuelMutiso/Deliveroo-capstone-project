import json
import threading
import time
from collections import OrderedDict
from math import asin, cos, radians, sin, sqrt

import requests
from flask import current_app

from ..utils.errors import ApiError

REQUEST_TIMEOUT = 10
ROAD_FACTOR = 1.32
AVERAGE_SPEED_KMH = 27
NOMINATIM_MIN_INTERVAL = 1.1
CACHE_LIMIT = 512

_nominatim_lock = threading.Lock()
_last_nominatim_call = 0.0

_search_cache = OrderedDict()
_reverse_cache = OrderedDict()
_route_cache = OrderedDict()


def _config(key, default):
    return current_app.config.get(key, default)


def _user_agent():
    return _config(
        "GEO_USER_AGENT",
        "Deliveroo-Capstone/1.0 (Moringa School; contact admin@deliveroo.co.ke)",
    )


def _cache_get(store, key):
    if key in store:
        store.move_to_end(key)
        return store[key]
    return None


def _cache_put(store, key, value):
    store[key] = value
    store.move_to_end(key)
    while len(store) > CACHE_LIMIT:
        store.popitem(last=False)


def _throttle_nominatim():
    global _last_nominatim_call
    with _nominatim_lock:
        elapsed = time.monotonic() - _last_nominatim_call
        if elapsed < NOMINATIM_MIN_INTERVAL:
            time.sleep(NOMINATIM_MIN_INTERVAL - elapsed)
        _last_nominatim_call = time.monotonic()


def haversine_km(origin, destination):
    lat1, lng1 = radians(origin[0]), radians(origin[1])
    lat2, lng2 = radians(destination[0]), radians(destination[1])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    h = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
    return round(2 * 6371 * asin(sqrt(h)), 2)


def offline():
    return bool(_config("GEO_OFFLINE", False))


def _nominatim(path, params):
    if offline():
        raise ApiError("Address lookup is disabled in this environment", 503)
    _throttle_nominatim()
    base = _config("NOMINATIM_URL", "https://nominatim.openstreetmap.org")
    response = requests.get(
        f"{base}/{path}",
        params=params,
        headers={"User-Agent": _user_agent(), "Accept": "application/json"},
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response.json()


def search(query, limit=6):
    text = (query or "").strip()
    if len(text) < 3:
        return []
    if offline():
        return []

    key = f"{text.lower()}|{limit}"
    cached = _cache_get(_search_cache, key)
    if cached is not None:
        return cached

    try:
        payload = _nominatim(
            "search",
            {
                "q": text,
                "format": "json",
                "limit": limit,
                "countrycodes": _config("GEO_COUNTRY_CODES", "ke"),
                "addressdetails": 0,
            },
        )
    except requests.RequestException as exc:
        raise ApiError("Address lookup is unavailable right now", 503) from exc

    results = [
        {
            "address": item["display_name"],
            "lat": float(item["lat"]),
            "lng": float(item["lon"]),
        }
        for item in payload
    ]
    _cache_put(_search_cache, key, results)
    return results


def geocode(address):
    results = search(address, limit=1)
    if not results:
        raise ApiError(f"Could not resolve the address '{address}'", 422)
    return results[0]


def reverse_geocode(lat, lng):
    if offline():
        return {"address": f"{float(lat):.5f}, {float(lng):.5f}", "lat": float(lat), "lng": float(lng)}

    key = f"{round(float(lat), 5)},{round(float(lng), 5)}"
    cached = _cache_get(_reverse_cache, key)
    if cached is not None:
        return cached

    try:
        payload = _nominatim(
            "reverse",
            {"lat": lat, "lon": lng, "format": "json", "zoom": 18},
        )
    except requests.RequestException:
        payload = {}

    address = payload.get("display_name") or f"{float(lat):.5f}, {float(lng):.5f}"
    result = {"address": address, "lat": float(lat), "lng": float(lng)}
    _cache_put(_reverse_cache, key, result)
    return result


def estimate_route(origin, destination):
    key = "%.5f,%.5f;%.5f,%.5f" % (origin[0], origin[1], destination[0], destination[1])
    cached = _cache_get(_route_cache, key)
    if cached is not None:
        return cached

    if offline():
        return _offline_estimate(origin, destination)

    base = _config("OSRM_URL", "https://router.project-osrm.org")
    path = f"{base}/route/v1/driving/{origin[1]},{origin[0]};{destination[1]},{destination[0]}"

    try:
        response = requests.get(
            path,
            params={"overview": "full", "geometries": "geojson"},
            timeout=REQUEST_TIMEOUT,
        )
        payload = response.json()
    except (requests.RequestException, ValueError):
        return _offline_estimate(origin, destination)

    if payload.get("code") != "Ok" or not payload.get("routes"):
        return _offline_estimate(origin, destination)

    route = payload["routes"][0]
    coordinates = [
        [point[1], point[0]]
        for point in route.get("geometry", {}).get("coordinates", [])
    ]

    result = {
        "distance_km": round(route["distance"] / 1000, 2),
        "duration_min": max(1, round(route["duration"] / 60)),
        "polyline": json.dumps(coordinates) if coordinates else None,
        "coordinates": coordinates,
        "source": "osrm",
    }
    _cache_put(_route_cache, key, result)
    return result


def _offline_estimate(origin, destination):
    straight = haversine_km(origin, destination)
    distance = round(straight * ROAD_FACTOR, 2)
    return {
        "distance_km": distance,
        "duration_min": max(5, round(distance / AVERAGE_SPEED_KMH * 60)),
        "polyline": None,
        "coordinates": [],
        "source": "haversine_estimate",
    }
