from datetime import timedelta

from flask import Blueprint, request
from sqlalchemy import case, func, or_

from ..constants import (
    APPLICATION_APPROVED,
    APPLICATION_PENDING,
    APPLICATION_REJECTED,
    APPLICATION_STATUSES,
    ORDER_STATUSES,
    ROLE_COURIER,
    STATUS_CANCELLED,
    STATUS_DELIVERED,
    STATUS_IN_TRANSIT,
    STATUS_PENDING,
    STATUS_PICKED_UP,
    TERMINAL_STATUSES,
    USER_ROLES,
)
from ..extensions import db
from ..utils.clock import utcnow
from ..models import CourierApplication, Order, TrackingEvent, User
from ..schemas import (
    admin_user_update_schema,
    application_decision_schema,
    assign_courier_schema,
    courier_application_schema,
    location_update_schema,
    order_detail_schema,
    order_schema,
    status_update_schema,
    user_schema,
    user_summary_schema,
)
from ..services import mailer, notifications, onboarding, sms
from ..utils.decorators import admin_required, current_user
from ..utils.errors import ApiError, ConflictError, NotFoundError
from ..utils.pagination import paginate

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def order_or_404(order_id):
    order = db.session.get(Order, order_id)
    if order is None:
        raise NotFoundError("Order not found")
    return order


@admin_bp.get("/orders")
@admin_required
def list_all_orders():
    """Paginated list of every order, with status, courier and search filters."""
    query = Order.query

    status = request.args.get("status")
    if status == "active":
        query = query.filter(~Order.status.in_(TERMINAL_STATUSES))
    elif status:
        if status not in ORDER_STATUSES:
            raise ApiError(f"Unknown status '{status}'")
        query = query.filter(Order.status == status)

    courier_id = request.args.get("courier_id")
    if courier_id == "unassigned":
        query = query.filter(Order.courier_id.is_(None))
    elif courier_id:
        query = query.filter(Order.courier_id == int(courier_id))

    search = (request.args.get("search") or "").strip()
    if search:
        pattern = f"%{search}%"
        query = query.join(User, Order.customer_id == User.id).filter(
            or_(
                Order.tracking_code.ilike(pattern),
                Order.destination_address.ilike(pattern),
                Order.pickup_address.ilike(pattern),
                User.name.ilike(pattern),
                User.email.ilike(pattern),
            )
        )

    query = query.order_by(Order.created_at.desc())
    return paginate(query, order_schema)


@admin_bp.get("/orders/<int:order_id>")
@admin_required
def get_any_order(order_id):
    """Return any order with its timeline."""
    return {"order": order_detail_schema.dump(order_or_404(order_id))}


@admin_bp.patch("/orders/<int:order_id>/status")
@admin_required
def set_status(order_id):
    """Set an order to any status, bypassing the courier progression rules."""
    admin = current_user()
    order = order_or_404(order_id)
    data = status_update_schema.load(request.get_json() or {})

    if order.status == data["status"]:
        raise ApiError(f"This order is already {order.status}", 409)
    if order.status in TERMINAL_STATUSES and data["status"] not in TERMINAL_STATUSES:
        raise ApiError(f"A {order.status} order cannot be reopened", 409)

    order.mark_status(data["status"])
    TrackingEvent.record(
        order,
        data["status"],
        data.get("note") or f"Status set by {admin.name}",
        actor=admin,
    )
    db.session.commit()

    notifications.notify_status(order)
    return {"order": order_detail_schema.dump(order)}


@admin_bp.patch("/orders/<int:order_id>/location")
@admin_required
def set_location(order_id):
    """Override the parcel's current location."""
    admin = current_user()
    order = order_or_404(order_id)
    data = location_update_schema.load(request.get_json() or {})

    order.current_lat = data["lat"]
    order.current_lng = data["lng"]
    TrackingEvent.record(
        order,
        order.status,
        data.get("note") or "Location corrected by admin",
        actor=admin,
        lat=data["lat"],
        lng=data["lng"],
    )
    db.session.commit()

    return {"order": order_detail_schema.dump(order)}


@admin_bp.patch("/orders/<int:order_id>/assign")
@admin_required
def assign_courier(order_id):
    """Assign an active courier to an open order."""
    admin = current_user()
    order = order_or_404(order_id)
    data = assign_courier_schema.load(request.get_json() or {})

    if order.status in TERMINAL_STATUSES:
        raise ApiError(f"A {order.status} order cannot be assigned", 409)

    courier = User.query.filter_by(id=data["courier_id"], role=ROLE_COURIER).first()
    if courier is None:
        raise NotFoundError("Courier not found")
    if not courier.is_active:
        raise ApiError("That courier account is deactivated", 409)

    order.courier_id = courier.id
    TrackingEvent.record(order, order.status, f"Assigned to {courier.name}", actor=admin)
    db.session.commit()

    notifications.notify(order, notifications.COURIER_ASSIGNED)
    return {"order": order_detail_schema.dump(order)}


@admin_bp.get("/couriers")
@admin_required
def list_couriers():
    """Active couriers with their live workload, for the assignment picker."""
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
        .order_by(User.is_available.desc(), User.name)
        .all()
    )

    return {
        "couriers": [
            {
                **user_summary_schema.dump(courier),
                "active_orders": int(load),
                "availability": _availability(courier, int(load)),
            }
            for courier, load in rows
        ]
    }


def _availability(courier, active_orders):
    if not courier.is_available:
        return "offline"
    if active_orders >= 3:
        return "busy"
    return "available"


@admin_bp.get("/users")
@admin_required
def list_users():
    """Paginated directory of every account."""
    query = User.query

    role = request.args.get("role")
    if role:
        if role not in USER_ROLES:
            raise ApiError(f"Unknown role '{role}'")
        query = query.filter(User.role == role)

    search = (request.args.get("search") or "").strip()
    if search:
        pattern = f"%{search}%"
        query = query.filter(or_(User.name.ilike(pattern), User.email.ilike(pattern)))

    query = query.order_by(User.created_at.desc())
    return paginate(query, user_schema)


@admin_bp.patch("/users/<int:user_id>")
@admin_required
def update_user(user_id):
    """Change a user's role or activation state."""
    admin = current_user()
    user = db.session.get(User, user_id)
    if user is None:
        raise NotFoundError("User not found")
    if user.id == admin.id:
        raise ApiError("You cannot change your own role or status", 409)

    data = admin_user_update_schema.load(request.get_json() or {})
    for field, value in data.items():
        setattr(user, field, value)
    db.session.commit()

    return {"user": user_schema.dump(user)}


@admin_bp.get("/stats")
@admin_required
def dashboard_stats():
    """Aggregated counters, a daily series and courier performance."""
    now = utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today - timedelta(days=6)

    status_rows = db.session.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
    by_status = {status: 0 for status in ORDER_STATUSES}
    by_status.update({status: count for status, count in status_rows})
    total = sum(by_status.values())

    revenue = (
        db.session.query(func.coalesce(func.sum(Order.price_kes), 0.0))
        .filter(Order.status == STATUS_DELIVERED)
        .scalar()
        or 0.0
    )

    daily_rows = (
        db.session.query(
            func.date(Order.created_at).label("day"),
            func.count(Order.id),
            func.coalesce(func.sum(case((Order.status == STATUS_DELIVERED, 1), else_=0)), 0),
        )
        .filter(Order.created_at >= week_start)
        .group_by("day")
        .all()
    )
    daily_map = {str(day): (int(created), int(delivered)) for day, created, delivered in daily_rows}

    daily = []
    for offset in range(7):
        day = (week_start + timedelta(days=offset)).date()
        created, delivered = daily_map.get(str(day), (0, 0))
        daily.append({"date": day.isoformat(), "created": created, "delivered": delivered})

    courier_rows = (
        db.session.query(
            User.id,
            User.name,
            func.count(Order.id),
            func.coalesce(func.sum(case((Order.status == STATUS_DELIVERED, 1), else_=0)), 0),
            func.coalesce(
                func.sum(case((Order.status == STATUS_DELIVERED, Order.distance_km), else_=0.0)),
                0.0,
            ),
        )
        .outerjoin(Order, Order.courier_id == User.id)
        .filter(User.role == ROLE_COURIER, User.is_active.is_(True))
        .group_by(User.id, User.name)
        .order_by(func.count(Order.id).desc())
        .all()
    )

    couriers = []
    for courier_id, name, assigned, delivered, distance in courier_rows:
        assigned = int(assigned)
        delivered = int(delivered)
        couriers.append(
            {
                "id": courier_id,
                "name": name,
                "assigned": assigned,
                "delivered": delivered,
                "distance_km": round(float(distance), 1),
                "completion_rate": round(delivered / assigned * 100) if assigned else 0,
            }
        )

    active = by_status[STATUS_PENDING] + by_status[STATUS_PICKED_UP] + by_status[STATUS_IN_TRANSIT]
    closed = by_status[STATUS_DELIVERED] + by_status[STATUS_CANCELLED]

    return {
        "totals": {
            "orders": total,
            "active": active,
            "completed": closed,
            "delivered": by_status[STATUS_DELIVERED],
            "cancelled": by_status[STATUS_CANCELLED],
            "unassigned": Order.query.filter(
                Order.courier_id.is_(None), ~Order.status.in_(TERMINAL_STATUSES)
            ).count(),
            "revenue_kes": round(float(revenue), 2),
            "customers": User.query.filter_by(role="customer").count(),
            "couriers": User.query.filter_by(role=ROLE_COURIER).count(),
        },
        "by_status": by_status,
        "daily": daily,
        "couriers": couriers,
    }


@admin_bp.get("/courier-applications")
@admin_required
def list_applications():
    """Rider applications, newest first, pending ones by default."""
    status = request.args.get("status", APPLICATION_PENDING)

    query = CourierApplication.query
    if status != "all":
        if status not in APPLICATION_STATUSES:
            raise ApiError(f"Unknown application status '{status}'")
        query = query.filter(CourierApplication.status == status)

    applications = query.order_by(CourierApplication.created_at.desc()).all()

    return {
        "applications": [courier_application_schema.dump(a) for a in applications],
        "pending_count": CourierApplication.query.filter_by(status=APPLICATION_PENDING).count(),
    }


@admin_bp.patch("/courier-applications/<int:application_id>/approve")
@admin_required
def approve_application(application_id):
    """Approve an applicant and issue them a company rider login."""
    admin = current_user()
    application = _application_or_404(application_id)
    data = application_decision_schema.load(request.get_json() or {})

    rider, password = onboarding.create_rider_account(application)

    application.status = APPLICATION_APPROVED
    application.courier_id = rider.id
    application.company_email = rider.email
    application.temporary_password = password
    application.reviewed_by_id = admin.id
    application.reviewed_at = utcnow()
    application.review_note = data.get("note")

    db.session.commit()

    _email_decision(application, rider=rider, password=password)

    return {
        "application": courier_application_schema.dump(application),
        "credentials": {"email": rider.email, "password": password},
    }


@admin_bp.patch("/courier-applications/<int:application_id>/reject")
@admin_required
def reject_application(application_id):
    """Turn an applicant down, with a reason they can read."""
    admin = current_user()
    application = _application_or_404(application_id)
    data = application_decision_schema.load(request.get_json() or {})

    application.status = APPLICATION_REJECTED
    application.reviewed_by_id = admin.id
    application.reviewed_at = utcnow()
    application.review_note = data.get("note")

    db.session.commit()

    _email_decision(application)

    return {"application": courier_application_schema.dump(application)}


def _application_or_404(application_id):
    application = db.session.get(CourierApplication, application_id)
    if application is None:
        raise NotFoundError("Application not found")
    if application.status != APPLICATION_PENDING:
        raise ConflictError(f"This application was already {application.status}")
    return application


def _email_decision(application, rider=None, password=None):
    """Tell the applicant on their personal address. The company address has no inbox."""
    recipient = application.applicant.notification_email

    if rider is None:
        note = application.review_note or "We are not able to take you on at the moment."
        mailer.send_email(
            "Your Deliveroo rider application",
            recipient,
            f"Hello {application.full_name},\n\n{note}\n\nYou can apply again at any time.",
        )
        return

    body = (
        f"Hello {application.full_name},\n\n"
        f"You have been approved to ride with Deliveroo.\n\n"
        f"Rider sign-in: {rider.email}\n"
        f"Temporary password: {password}\n\n"
        f"Sign in with that address and change the password from your profile. "
        f"Your personal account stays exactly as it is, so you can still send parcels as a customer."
    )
    mailer.send_email("You are approved to ride with Deliveroo", recipient, body)
    sms.send_sms(
        application.phone,
        f"Deliveroo: approved. Rider login {rider.email}, temporary password {password}.",
    )


@admin_bp.get("/users/<int:user_id>")
@admin_required
def user_detail(user_id):
    """Everything operations needs about one account. Never the password."""
    person = db.session.get(User, user_id)
    if person is None:
        raise NotFoundError("User not found")

    placed = Order.query.filter(Order.customer_id == person.id)
    carried = Order.query.filter(Order.courier_id == person.id)

    def spread(query):
        rows = query.with_entities(Order.status, func.count(Order.id)).group_by(Order.status).all()
        counts = {status: 0 for status in ORDER_STATUSES}
        counts.update({status: int(count) for status, count in rows})
        return counts

    spent = (
        placed.filter(Order.status == STATUS_DELIVERED)
        .with_entities(func.coalesce(func.sum(Order.price_kes), 0.0))
        .scalar()
        or 0.0
    )
    earned_distance = (
        carried.filter(Order.status == STATUS_DELIVERED)
        .with_entities(func.coalesce(func.sum(Order.distance_km), 0.0))
        .scalar()
        or 0.0
    )

    application = (
        CourierApplication.query.filter_by(applicant_id=person.id)
        .order_by(CourierApplication.created_at.desc())
        .first()
    )

    recent = (
        Order.query.filter(
            or_(Order.customer_id == person.id, Order.courier_id == person.id)
        )
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "user": user_schema.dump(person),
        "activity": {
            "placed": placed.count(),
            "placed_by_status": spread(placed),
            "spent_kes": round(float(spent), 2),
            "carried": carried.count(),
            "carried_by_status": spread(carried),
            "distance_km": round(float(earned_distance), 2),
        },
        "application": courier_application_schema.dump(application) if application else None,
        "recent_orders": [order_schema.dump(order) for order in recent],
    }