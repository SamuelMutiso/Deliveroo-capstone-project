from functools import wraps

from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from ..constants import ROLE_ADMIN, ROLE_COURIER, ROLE_CUSTOMER
from ..extensions import db
from ..models import User
from .errors import ForbiddenError, NotFoundError

REVOKED_TOKENS = set()


def current_user():
    identity = get_jwt_identity()
    if identity is None:
        return None
    return db_session_user(identity)


def db_session_user(identity):
    user = db.session.get(User, int(identity))
    if user is None or not user.is_active:
        raise ForbiddenError("This account is no longer active")
    return user


def role_required(*roles):
    def decorator(view):
        @wraps(view)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user = current_user()
            if user.role not in roles:
                raise ForbiddenError("Your role does not have access to this resource")
            return view(*args, **kwargs)

        return wrapper

    return decorator


customer_required = role_required(ROLE_CUSTOMER)
courier_required = role_required(ROLE_COURIER)
admin_required = role_required(ROLE_ADMIN)


def owned_order_or_404(order_id, user):
    from ..models import Order

    order = db.session.get(Order, order_id)
    if order is None:
        raise NotFoundError("Order not found")
    if user.role == ROLE_ADMIN:
        return order
    if user.role == ROLE_CUSTOMER and order.customer_id == user.id:
        return order
    if user.role == ROLE_COURIER and order.courier_id == user.id:
        return order
    raise ForbiddenError("You do not have access to this order")