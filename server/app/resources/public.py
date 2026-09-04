import time
from threading import Lock

from flask import Blueprint, request
from sqlalchemy import func

from ..constants import (
    ROLE_COURIER,
    STATUS_CANCELLED,
    STATUS_DELIVERED,
    WEIGHT_CATEGORIES,
)
from ..extensions import db
from ..models import Order, User
from ..schemas import quote_schema
from ..services import maps, pricing
from ..utils.errors import ApiError, NotFoundError

public_bp = Blueprint("public", __name__, url_prefix="/api/public")

WINDOW_SECONDS = 60
MAX_CALLS = 30
SEARCH_LIMIT = 5

_hits = {}
_lock = Lock()


def throttle():
    """Keep an open endpoint from being hammered, without adding a dependency."""
    caller = request.headers.get("X-Forwarded-For", request.remote_addr or "anonymous")
    caller = caller.split(",")[0].strip()
    now = time.time()

    with _lock:
        recent = [stamp for stamp in _hits.get(caller, []) if now - stamp < WINDOW_SECONDS]
        if len(recent) >= MAX_CALLS:
            raise ApiError("Too many requests. Give it a minute.", 429)
        recent.append(now)
        _hits[caller] = recent

        if len(_hits) > 2000:
            for key in [k for k, v in _hits.items() if not v or now - v[-1] > WINDOW_SECONDS]:
                _hits.pop(key, None)


@public_bp.get("/stats")
def network_stats():
    """Headline numbers for the landing page. Counts only, never anyone's details."""
    throttle()

    delivered = Order.query.filter_by(status=STATUS_DELIVERED).count()
    riders = User.query.filter_by(role=ROLE_COURIER, is_active=True).count()

    average_minutes = (
        db.session.query(func.avg(Order.duration_min))
        .filter(Order.status == STATUS_DELIVERED)
        .scalar()
    )
    average_rating = (
        db.session.query(func.avg(Order.rating))
        .filter(Order.rating.isnot(None))
        .scalar()
    )
    rated = Order.query.filter(Order.rating.isnot(None)).count()

    return {
        "delivered": delivered,
        "riders": riders,
        "average_minutes": round(float(average_minutes)) if average_minutes else None,
        "average_rating": round(float(average_rating), 1) if average_rating else None,
        "ratings_count": rated,
    }


@public_bp.get("/categories")
def weight_categories():
    """The weight bands, so a visitor can price a parcel before signing up."""
    throttle()
    return {
        "categories": [
            {
                "value": value,
                "label": tier["label"],
                "description": tier["description"],
                "max_kg": tier["max_kg"],
            }
            for value, tier in WEIGHT_CATEGORIES.items()
        ]
    }


@public_bp.get("/places")
def search_places():
    """Address suggestions for the landing page quote box."""
    throttle()
    return {"results": maps.search(request.args.get("q", ""), limit=SEARCH_LIMIT)}


@public_bp.post("/quote")
def preview_quote():
    """Price a route for someone who has not signed up yet."""
    throttle()
    data = quote_schema.load(request.get_json() or {})
    route = maps.estimate_route(
        (data["pickup_lat"], data["pickup_lng"]),
        (data["destination_lat"], data["destination_lng"]),
    )
    breakdown = pricing.quote(route["distance_km"], data["weight_category"])
    return {"route": route, "quote": breakdown}


@public_bp.get("/track/<code>")
def track_parcel(code):
    """Where a parcel has got to. Deliberately returns no names, addresses or phone numbers."""
    throttle()

    tracking_code = (code or "").strip().upper()
    if len(tracking_code) < 6:
        raise ApiError("That is not a tracking code", 400)

    order = Order.query.filter_by(tracking_code=tracking_code).first()
    if order is None:
        raise NotFoundError("No parcel with that tracking code")

    return {
        "parcel": {
            "tracking_code": order.tracking_code,
            "status": order.status,
            "distance_km": order.distance_km,
            "duration_min": order.duration_min,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "picked_up_at": order.picked_up_at.isoformat() if order.picked_up_at else None,
            "delivered_at": order.delivered_at.isoformat() if order.delivered_at else None,
            "is_closed": order.status in (STATUS_DELIVERED, STATUS_CANCELLED),
        }
    }
