from sqlalchemy.orm import validates

from ..constants import PAYMENT_PENDING, PAYMENT_STATUSES
from ..extensions import db
from ..utils.clock import utcnow


class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False, unique=True)

    amount_kes = db.Column(db.Float, nullable=False)
    method = db.Column(db.String(20), nullable=False, default="mpesa")
    status = db.Column(db.String(20), nullable=False, default=PAYMENT_PENDING, index=True)
    phone = db.Column(db.String(24))

    checkout_request_id = db.Column(db.String(80), index=True)
    merchant_request_id = db.Column(db.String(80))
    mpesa_receipt = db.Column(db.String(40))
    result_description = db.Column(db.String(255))
    raw_callback = db.Column(db.JSON)

    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)
    paid_at = db.Column(db.DateTime)

    order = db.relationship("Order", back_populates="payment")

    @validates("status")
    def validate_status(self, _key, value):
        if value not in PAYMENT_STATUSES:
            raise ValueError(f"status must be one of {', '.join(PAYMENT_STATUSES)}")
        return value

    def __repr__(self):
        return f"<Payment order={self.order_id} {self.status}>"
