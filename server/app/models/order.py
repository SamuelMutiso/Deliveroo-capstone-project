import secrets
import string

from sqlalchemy.orm import validates

from ..constants import (
    ORDER_STATUSES,
    STATUS_CANCELLED,
    STATUS_DELIVERED,
    STATUS_PENDING,
    TERMINAL_STATUSES,
    WEIGHT_CATEGORIES,
)
from ..extensions import db
from ..utils.clock import utcnow

ALPHABET = string.ascii_uppercase.replace("O", "").replace("I", "") + "23456789"


def generate_tracking_code():
    while True:
        code = "DLV-" + "".join(secrets.choice(ALPHABET) for _ in range(6))
        if not db.session.query(Order.id).filter_by(tracking_code=code).first():
            return code


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    tracking_code = db.Column(db.String(16), nullable=False, unique=True, index=True)

    customer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    courier_id = db.Column(db.Integer, db.ForeignKey("users.id"), index=True)

    pickup_address = db.Column(db.String(255), nullable=False)
    pickup_lat = db.Column(db.Float, nullable=False)
    pickup_lng = db.Column(db.Float, nullable=False)

    destination_address = db.Column(db.String(255), nullable=False)
    destination_lat = db.Column(db.Float, nullable=False)
    destination_lng = db.Column(db.Float, nullable=False)

    current_lat = db.Column(db.Float)
    current_lng = db.Column(db.Float)

    weight_category = db.Column(db.String(20), nullable=False)
    weight_kg = db.Column(db.Float, nullable=False, default=1.0)

    distance_km = db.Column(db.Float, nullable=False, default=0.0)
    duration_min = db.Column(db.Integer, nullable=False, default=0)
    route_polyline = db.Column(db.Text)

    price_kes = db.Column(db.Float, nullable=False, default=0.0)
    price_breakdown = db.Column(db.JSON)

    status = db.Column(db.String(20), nullable=False, default=STATUS_PENDING, index=True)
    recipient_name = db.Column(db.String(120), nullable=False)
    recipient_phone = db.Column(db.String(24), nullable=False)
    recipient_email = db.Column(db.String(180))
    notes = db.Column(db.String(400))

    created_at = db.Column(db.DateTime, default=utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)
    picked_up_at = db.Column(db.DateTime)
    received_by = db.Column(db.String(120))

    rating = db.Column(db.Integer)
    rating_comment = db.Column(db.String(400))
    rated_at = db.Column(db.DateTime)

    receipt_sent_at = db.Column(db.DateTime)

    delivered_at = db.Column(db.DateTime)
    cancelled_at = db.Column(db.DateTime)

    customer = db.relationship("User", back_populates="orders", foreign_keys=[customer_id])
    courier = db.relationship("User", back_populates="deliveries", foreign_keys=[courier_id])
    events = db.relationship(
        "TrackingEvent",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="TrackingEvent.created_at",
    )
    payment = db.relationship(
        "Payment",
        back_populates="order",
        uselist=False,
        cascade="all, delete-orphan",
    )

    @validates("status")
    def validate_status(self, _key, value):
        if value not in ORDER_STATUSES:
            raise ValueError(f"status must be one of {', '.join(ORDER_STATUSES)}")
        return value

    @validates("weight_category")
    def validate_weight_category(self, _key, value):
        if value not in WEIGHT_CATEGORIES:
            raise ValueError(f"weight_category must be one of {', '.join(WEIGHT_CATEGORIES)}")
        return value

    @property
    def is_editable(self):
        return self.status == STATUS_PENDING

    @property
    def is_cancellable(self):
        return self.status not in TERMINAL_STATUSES

    @property
    def is_complete(self):
        return self.status == STATUS_DELIVERED

    def mark_status(self, status):
        self.status = status
        now = utcnow()
        if status == "picked_up" and not self.picked_up_at:
            self.picked_up_at = now
        elif status == STATUS_DELIVERED:
            self.delivered_at = now
            self.current_lat = self.destination_lat
            self.current_lng = self.destination_lng
        elif status == STATUS_CANCELLED:
            self.cancelled_at = now

    def __repr__(self):
        return f"<Order {self.tracking_code} {self.status}>"