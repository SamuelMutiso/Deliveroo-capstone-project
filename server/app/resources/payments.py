import time
from threading import Thread

from flask import Blueprint, current_app, request
from flask_jwt_extended import jwt_required

from ..constants import (
    PAYMENT_FAILED,
    PAYMENT_PAID,
    PAYMENT_PENDING,
    PAYMENT_PROCESSING,
    STATUS_CANCELLED,
)
from ..extensions import db
from ..utils.clock import utcnow
from ..models import Order, Payment
from ..schemas import checkout_schema, payment_schema
from ..services import mpesa, notifications
from ..utils.decorators import current_user, customer_required, owned_order_or_404
from ..utils.errors import ApiError

SIMULATED_SETTLE_SECONDS = 6

payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")


@payments_bp.get("/<int:order_id>")
@jwt_required()
def get_payment(order_id):
    """Return the payment record attached to an order."""
    order = owned_order_or_404(order_id, current_user())
    if order.payment is None:
        return {"payment": None, "amount_due_kes": order.price_kes}
    return {"payment": payment_schema.dump(order.payment), "amount_due_kes": order.price_kes}


@payments_bp.post("/<int:order_id>/mpesa")
@customer_required
def start_checkout(order_id):
    """Trigger an M-Pesa STK push for the order total."""
    user = current_user()
    order = owned_order_or_404(order_id, user)

    if order.status == STATUS_CANCELLED:
        raise ApiError("A cancelled order cannot be paid for", 409)
    if order.payment and order.payment.status == PAYMENT_PAID:
        raise ApiError("This order has already been paid for", 409)

    data = checkout_schema.load(request.get_json() or {})
    phone = mpesa.normalise_phone(data["phone"])

    payment = order.payment or Payment(order_id=order.id, amount_kes=order.price_kes)
    payment.amount_kes = order.price_kes
    payment.phone = phone
    payment.status = PAYMENT_PENDING
    payment.result_description = None
    db.session.add(payment)
    db.session.flush()

    result = mpesa.stk_push(
        phone=phone,
        amount=order.price_kes,
        reference=order.tracking_code,
        description=f"Deliveroo parcel {order.tracking_code}",
    )

    payment.checkout_request_id = result["checkout_request_id"]
    payment.merchant_request_id = result["merchant_request_id"]
    payment.status = PAYMENT_PROCESSING
    db.session.commit()

    if result.get("simulated"):
        _settle_simulated_payment(payment.id, SIMULATED_SETTLE_SECONDS)

    return {
        "payment": payment_schema.dump(payment),
        "message": result.get("customer_message") or "Check your phone to authorise the payment",
        "simulated": bool(result.get("simulated")),
    }, 202


def _settle_simulated_payment(payment_id, delay):
    """Mark a simulated checkout as paid shortly after, the way a real callback would."""
    app = current_app._get_current_object()

    def run():
        time.sleep(delay)
        with app.app_context():
            payment = db.session.get(Payment, payment_id)
            if payment is None or payment.status == PAYMENT_PAID:
                return
            payment.status = PAYMENT_PAID
            payment.mpesa_receipt = mpesa.simulated_receipt()
            payment.result_description = "Simulated payment accepted"
            payment.paid_at = utcnow()
            db.session.commit()

            order = db.session.get(Order, payment.order_id)
            if order is not None:
                notifications.notify(order, notifications.PAYMENT_RECEIVED)

    Thread(target=run, daemon=True).start()


@payments_bp.post("/mpesa/callback")
def mpesa_callback():
    """Public endpoint Safaricom calls with the STK push result."""
    payload = request.get_json(silent=True) or {}
    parsed = mpesa.parse_callback(payload)

    if not parsed["checkout_request_id"]:
        return {"ResultCode": 0, "ResultDesc": "Ignored"}

    payment = Payment.query.filter_by(
        checkout_request_id=parsed["checkout_request_id"]
    ).first()
    if payment is None:
        return {"ResultCode": 0, "ResultDesc": "Unknown checkout"}

    payment.raw_callback = payload
    payment.result_description = parsed["result_description"]

    if parsed["result_code"] in (0, "0"):
        payment.status = PAYMENT_PAID
        payment.mpesa_receipt = parsed["receipt"]
        payment.paid_at = utcnow()
        db.session.commit()
        notifications.notify(payment.order, notifications.PAYMENT_RECEIVED)
    else:
        payment.status = PAYMENT_FAILED
        db.session.commit()

    return {"ResultCode": 0, "ResultDesc": "Accepted"}
