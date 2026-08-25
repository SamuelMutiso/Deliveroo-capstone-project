from datetime import timedelta

from flask import Blueprint, request
from sqlalchemy import func

from ..constants import (
    COURIER_TRANSITIONS,
    ORDER_STATUSES,
    STATUS_DELIVERED,
    STATUS_IN_TRANSIT,
    STATUS_PICKED_UP,
    TERMINAL_STATUSES,
)
from ..extensions import db
from ..utils.clock import utcnow
from ..models import Order, TrackingEvent
from ..schemas import (
    availability_schema,
    location_update_schema,
    order_detail_schema,
    order_schema,
    status_update_schema,
)
from ..services import notifications
from ..utils.decorators import courier_required, current_user, owned_order_or_404
from ..utils.errors import ApiError
from ..utils.pagination import paginate

couriers_bp = Blueprint("couriers", __name__, url_prefix="/api/courier")


@couriers_bp.get("/orders")
@courier_required
def assigned_orders():
    """Paginated list of the deliveries assigned to this courier."""
    user = current_user()
    query = Order.query.filter_by(courier_id=user.id)

    status = request.args.get("status")
    if status:
        if status not in ORDER_STATUSES:
            raise ApiError(f"Unknown status '{status}'")
        query = query.filter(Order.status == status)

    if request.args.get("active") == "1":
        query = query.filter(~Order.status.in_(TERMINAL_STATUSES))

    query = query.order_by(Order.created_at.desc())
    return paginate(query, order_schema)


@couriers_bp.get("/orders/<int:order_id>")
@courier_required
def assigned_order(order_id):
    """Return one assigned delivery with its timeline."""
    order = owned_order_or_404(order_id, current_user())
    return {"order": order_detail_schema.dump(order)}


@couriers_bp.patch("/orders/<int:order_id>/status")
@courier_required
def advance_status(order_id):
    """Move an assigned delivery to the next allowed stage."""
    user = current_user()
    order = owned_order_or_404(order_id, user)
    data = status_update_schema.load(request.get_json() or {})
    target = data["status"]

    allowed = COURIER_TRANSITIONS.get(order.status, ())
    if target not in allowed:
        readable = ", ".join(allowed) if allowed else "no further stages"
        raise ApiError(f"From {order.status} a courier can only move to {readable}", 409)

    order.mark_status(target)
    TrackingEvent.record(order, target, data.get("note"), actor=user)
    db.session.commit()

    notifications.notify_status(order)
    return {"order": order_detail_schema.dump(order)}


@couriers_bp.patch("/orders/<int:order_id>/location")
@courier_required
def update_location(order_id):
    """Push the courier's live position onto an active delivery."""
    user = current_user()
    order = owned_order_or_404(order_id, user)

    if order.status in TERMINAL_STATUSES:
        raise ApiError("This delivery is already closed", 409)

    data = location_update_schema.load(request.get_json() or {})
    order.current_lat = data["lat"]
    order.current_lng = data["lng"]
    user.touch_location(data["lat"], data["lng"])

    TrackingEvent.record(
        order,
        order.status,
        data.get("note") or "Location updated",
        actor=user,
        lat=data["lat"],
        lng=data["lng"],
    )
    db.session.commit()

    return {"order": order_detail_schema.dump(order)}


@couriers_bp.patch("/availability")
@courier_required
def set_availability():
    """A rider marks themselves on or off duty, which is what admins see when assigning."""
    user = current_user()
    data = availability_schema.load(request.get_json() or {})

    user.is_available = bool(data["is_available"])
    if user.is_available:
        user.last_seen_at = utcnow()
    db.session.commit()

    return {"is_available": user.is_available}


@couriers_bp.get("/stats")
@courier_required
def courier_stats():
    """Summary counters for the courier dashboard."""
    user = current_user()
    week_ago = utcnow() - timedelta(days=7)

    rows = (
        db.session.query(Order.status, func.count(Order.id))
        .filter(Order.courier_id == user.id)
        .group_by(Order.status)
        .all()
    )
    by_status = {status: 0 for status in ORDER_STATUSES}
    by_status.update({status: count for status, count in rows})

    delivered_this_week = (
        db.session.query(func.count(Order.id))
        .filter(
            Order.courier_id == user.id,
            Order.status == STATUS_DELIVERED,
            Order.delivered_at >= week_ago,
        )
        .scalar()
        or 0
    )

    distance = (
        db.session.query(func.coalesce(func.sum(Order.distance_km), 0.0))
        .filter(Order.courier_id == user.id, Order.status == STATUS_DELIVERED)
        .scalar()
        or 0.0
    )

    return {
        "assigned_total": sum(by_status.values()),
        "active": by_status[STATUS_PICKED_UP] + by_status[STATUS_IN_TRANSIT],
        "delivered": by_status[STATUS_DELIVERED],
        "delivered_this_week": delivered_this_week,
        "distance_km": round(float(distance), 1),
        "by_status": by_status,
    }