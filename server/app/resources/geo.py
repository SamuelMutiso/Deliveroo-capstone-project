from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from ..services import maps
from ..utils.errors import ApiError

geo_bp = Blueprint("geo", __name__, url_prefix="/api/geo")

MAX_RESULTS = 8

def _float(name):
    raw = request.args.get(name)
    if raw is None:
        raise ApiError(f"'{name}' is required")
    try:
        return float(raw)
    except (TypeError, ValueError):
        raise ApiError(f"'{name}' must be a number")


@geo_bp.get("/search")
@jwt_required()
def search_places():
    """Address suggestions. The browser never calls Nominatim directly."""
    query = request.args.get("q", "")
    try:
        limit = min(MAX_RESULTS, max(1, int(request.args.get("limit", 6))))
    except (TypeError, ValueError):
        limit = 6

    return {"results": maps.search(query, limit=limit)}


@geo_bp.get("/reverse")
@jwt_required()
def reverse_place():
    """Turn a dropped pin into a street address."""
    lat = _float("lat")
    lng = _float("lng")
    return maps.reverse_geocode(lat, lng)


@geo_bp.post("/route")
@jwt_required()
def route_between():
    """Road route between two points, for drawing only. Pricing is computed on the server."""
    data = request.get_json() or {}
    required = ("pickup_lat", "pickup_lng", "destination_lat", "destination_lng")
    missing = [key for key in required if data.get(key) is None]
    if missing:
        raise ApiError("Missing " + ", ".join(missing))

    try:
        origin = (float(data["pickup_lat"]), float(data["pickup_lng"]))
        destination = (float(data["destination_lat"]), float(data["destination_lng"]))
    except (TypeError, ValueError):
        raise ApiError("Coordinates must be numbers")

    return {"route": maps.estimate_route(origin, destination)}
