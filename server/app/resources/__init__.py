from .admin import admin_bp
from .applications import applications_bp
from .auth import auth_bp
from .couriers import couriers_bp
from .geo import geo_bp
from .orders import orders_bp
from .payments import payments_bp

BLUEPRINTS = (
    auth_bp,
    orders_bp,
    couriers_bp,
    admin_bp,
    payments_bp,
    applications_bp,
    geo_bp,
)

__all__ = [
    "BLUEPRINTS",
    "admin_bp",
    "applications_bp",
    "auth_bp",
    "couriers_bp",
    "geo_bp",
    "orders_bp",
    "payments_bp",
]
