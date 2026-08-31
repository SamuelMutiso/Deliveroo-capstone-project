from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy import or_

from ..constants import (
    ORDER_STATUSES,
    ROLE_COURIER,
    STATUS_CANCELLED,
    STATUS_DELIVERED,
    STATUS_PENDING,
    TERMINAL_STATUSES,
    WEIGHT_CATEGORIES,
)
from ..extensions import db
from ..models import Order, TrackingEvent, User, generate_tracking_code
from ..schemas import (
    destination_update_schema,
    order_create_schema,
    order_detail_schema,
    order_schema,
    quote_schema,
    rating_schema,
    tracking_event_schema,
)
from ..services import maps, notifications, pricing, receipts
from ..utils.clock import utcnow
from ..utils.decorators import current_user, customer_required, owned_order_or_404
from ..utils.errors import ApiError
from ..utils.pagination import paginate

def declared_weight(data):
    """The customer picks a band, not a number. Record the band ceiling as the weight."""
    given = data.get("weight_kg")
    if given:
        return float(given)
    return float(WEIGHT_CATEGORIES[data["weight_category"]]["max_kg"])


orders_bp = Blueprint("orders", __name__, url_prefix="/api/orders")


@orders_bp.get("/categories")
def categories():
    """List the weight categories and their pricing factors."""
    return {"categories": pricing.category_catalogue()}


@orders_bp.post("/quote")
@jwt_required()
def preview_quote():
    """Return a price and route estimate without creating an order."""
    data = quote_schema.load(request.get_json() or {})
    route = maps.estimate_route(
        (data["pickup_lat"], data["pickup_lng"]),
        (data["destination_lat"], data["destination_lng"]),
    )
    breakdown = pricing.quote(route["distance_km"], data["weight_category"], declared_weight(data))
    return {"route": route, "quote": breakdown}


@orders_bp.get("")
@customer_required
def list_orders():
    """Paginated list of the signed-in customer's own orders."""
    user = current_user()
    query = Order.query.filter_by(customer_id=user.id)

    status = request.args.get("status")
    if status:
        if status not in ORDER_STATUSES:
            raise ApiError(f"Unknown status '{status}'")
        query = query.filter(Order.status == status)

    search = (request.args.get("search") or "").strip()
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Order.tracking_code.ilike(pattern),
                Order.destination_address.ilike(pattern),
                Order.recipient_name.ilike(pattern),
            )
        )

    query = query.order_by(Order.created_at.desc())
    return paginate(query, order_schema)


@orders_bp.post("")
@customer_required
def create_order():
    """Create a delivery order, pricing it from the routed distance."""
    user = current_user()
    data = order_create_schema.load(request.get_json() or {})

    route = maps.estimate_route(
        (data["pickup_lat"], data["pickup_lng"]),
        (data["destination_lat"], data["destination_lng"]),
    )
    breakdown = pricing.quote(route["distance_km"], data["weight_category"], declared_weight(data))

    order = Order(
        tracking_code=generate_tracking_code(),
        customer_id=user.id,
        pickup_address=data["pickup_address"],
        pickup_lat=data["pickup_lat"],
        pickup_lng=data["pickup_lng"],
        destination_address=data["destination_address"],
        destination_lat=data["destination_lat"],
        destination_lng=data["destination_lng"],
        current_lat=data["pickup_lat"],
        current_lng=data["pickup_lng"],
        weight_category=data["weight_category"],
        weight_kg=declared_weight(data),
        distance_km=route["distance_km"],
        duration_min=route["duration_min"],
        route_polyline=route["polyline"],
        price_kes=breakdown["total"],
        price_breakdown=breakdown,
        recipient_name=data["recipient_name"],
        recipient_phone=data["recipient_phone"],
        recipient_email=data.get("recipient_email"),
        notes=data.get("notes"),
        status=STATUS_PENDING,
    )

    db.session.add(order)
    db.session.flush()
    TrackingEvent.record(order, STATUS_PENDING, "Order created", actor=user)
    db.session.commit()

    notifications.notify(order, notifications.ORDER_CREATED)
    return {"order": order_detail_schema.dump(order)}, 201


@orders_bp.get("/couriers")
@jwt_required()
def available_couriers():
    """Riders a customer can request, with their current workload. No contact details."""
    from sqlalchemy import func

    active_load = (
        db.session.query(
            Order.courier_id.label("courier_id"),
            func.count(Order.id).label("active_orders"),
        )
        .filter(~Order.status.in_(TERMINAL_STATUSES))
        .group_by(Order.courier_id)
        .subquery()
    )

    rows = (
        db.session.query(User, func.coalesce(active_load.c.active_orders, 0))
        .outerjoin(active_load, active_load.c.courier_id == User.id)
        .filter(User.role == ROLE_COURIER, User.is_active.is_(True))
        .order_by(User.name)
        .all()
    )

    return {
        "couriers": [
            {
                "id": courier.id,
                "name": courier.name,
                "vehicle": courier.vehicle,
                "active_orders": int(load),
            }
            for courier, load in rows
        ]
    }


@orders_bp.get("/<int:order_id>")
@jwt_required()
def get_order(order_id):
    """Return one order with its full tracking history."""
    order = owned_order_or_404(order_id, current_user())
    return {"order": order_detail_schema.dump(order)}


@orders_bp.get("/<int:order_id>/events")
@jwt_required()
def order_events(order_id):
    """Return the tracking timeline for one order."""
    order = owned_order_or_404(order_id, current_user())
    return {"events": tracking_event_schema.dump(order.events, many=True)}


@orders_bp.patch("/<int:order_id>/destination")
@customer_required
def change_destination(order_id):
    """Change the destination while the order is still pending."""
    user = current_user()
    order = owned_order_or_404(order_id, user)

    if not order.is_editable:
        raise ApiError("The destination can only change while the order is pending", 409)

    data = destination_update_schema.load(request.get_json() or {})
    order.destination_address = data["destination_address"]
    order.destination_lat = data["destination_lat"]
    order.destination_lng = data["destination_lng"]

    route = maps.estimate_route(
        (order.pickup_lat, order.pickup_lng),
        (order.destination_lat, order.destination_lng),
    )
    breakdown = pricing.quote(route["distance_km"], order.weight_category, order.weight_kg)

    order.distance_km = route["distance_km"]
    order.duration_min = route["duration_min"]
    order.route_polyline = route["polyline"]
    order.price_kes = breakdown["total"]
    order.price_breakdown = breakdown

    TrackingEvent.record(
        order,
        order.status,
        f"Destination changed to {order.destination_address}",
        actor=user,
    )
    db.session.commit()

    return {"order": order_detail_schema.dump(order)}


@orders_bp.patch("/<int:order_id>/cancel")
@customer_required
def cancel_order(order_id):
    """Cancel an order that has not yet been delivered."""
    user = current_user()
    order = owned_order_or_404(order_id, user)

    if not order.is_cancellable:
        raise ApiError(f"An order that is already {order.status} cannot be cancelled", 409)

    order.mark_status(STATUS_CANCELLED)
    TrackingEvent.record(order, STATUS_CANCELLED, "Cancelled by customer", actor=user)
    db.session.commit()

    notifications.notify_status(order)
    return {"order": order_detail_schema.dump(order)}


@orders_bp.post("/<int:order_id>/rating")
@customer_required
def rate_delivery(order_id):
    """Rate a completed delivery. One rating per order, and only once it has arrived."""
    user = current_user()
    order = owned_order_or_404(order_id, user)

    if order.status != STATUS_DELIVERED:
        raise ApiError("You can only rate a delivery once it has arrived", 409)
    if order.rating is not None:
        raise ApiError("This delivery has already been rated", 409)

    data = rating_schema.load(request.get_json() or {})

    order.rating = data["rating"]
    order.rating_comment = (data.get("comment") or "").strip() or None
    order.rated_at = utcnow()
    db.session.commit()

    return {"order": order_detail_schema.dump(order)}


@orders_bp.get("/verify/<reference>")
def verify_receipt(reference):
    """Public check that a printed receipt reference is genuine. Deliberately sparse."""
    tracking_code, digest = receipts.split_reference(reference)
    if not tracking_code or not digest:
        return {"valid": False, "reason": "That reference is not in the expected format"}, 200

    order = Order.query.filter_by(tracking_code=tracking_code).first()

    if order is None or order.status != STATUS_DELIVERED or not receipts.matches(order, digest):
        return {"valid": False, "reason": "No delivered parcel matches that reference"}, 200

    return {
        "valid": True,
        "receipt": {
            "tracking_code": order.tracking_code,
            "delivered_at": order.delivered_at.isoformat() if order.delivered_at else None,
            "received_by": order.received_by or order.recipient_name,
            "courier": order.courier.name if order.courier else None,
            "amount_kes": order.price_kes,
            "payment_status": order.payment.status if order.payment else "unpaid",
        },
    }
