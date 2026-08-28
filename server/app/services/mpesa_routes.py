from flask import Blueprint, request, jsonify

from ..extensions import db

from ..models.order import Order
from ..models.payment import Payment

from ..services.mpesa import (
    stk_push,
    parse_callback,
    normalise_phone
)

from ..utils.clock import utcnow

from ..constants import (
    PAYMENT_PENDING,
    PAYMENT_PROCESSING,
    PAYMENT_PAID,
    PAYMENT_FAILED,
)


mpesa_bp = Blueprint(
    "mpesa",
    __name__
)


# =========================================================
# INITIATE PAYMENT
# =========================================================

@mpesa_bp.route(
    "/api/pay",
    methods=["POST"]
)
def initiate_payment():

    data = request.get_json() or {}

    order_id = data.get("order_id")
    phone = data.get("phone")

    # -----------------------------------------------------
    # Validate request
    # -----------------------------------------------------

    if not order_id or not phone:
        return jsonify({
            "message":
                "order_id and phone are required"
        }), 400

    # -----------------------------------------------------
    # Find order
    # -----------------------------------------------------

    order = Order.query.get(order_id)

    if not order:
        return jsonify({
            "message":
                "Order not found"
        }), 404

    # -----------------------------------------------------
    # Validate amount
    # -----------------------------------------------------

    if not order.price_kes or order.price_kes <= 0:
        return jsonify({
            "message":
                "Order does not have a valid payment amount."
        }), 400

    # -----------------------------------------------------
    # Normalise phone number
    # -----------------------------------------------------

    try:
        phone = normalise_phone(phone)

    except Exception as error:

        return jsonify({
            "message": str(error)
        }), 422

    # -----------------------------------------------------
    # Prevent duplicate payment
    # -----------------------------------------------------

    if order.payment:

        return jsonify({
            "message":
                "This order already has a payment."
        }), 400

    # -----------------------------------------------------
    # Create payment record
    # -----------------------------------------------------

    payment = Payment(
        order_id=order.id,

        amount_kes=order.price_kes,

        method="mpesa",

        status=PAYMENT_PENDING,

        phone=phone
    )

    db.session.add(payment)

    db.session.commit()

    # -----------------------------------------------------
    # Send STK Push
    # -----------------------------------------------------

    try:

        result = stk_push(
            phone_number=phone,

            amount=order.price_kes,

            reference=order.tracking_code,

            description="Delivery payment"
        )

        # -----------------------------------------------
        # Daraja accepted the STK request
        # -----------------------------------------------

        payment.status = PAYMENT_PROCESSING

        payment.checkout_request_id = (
            result.get(
                "checkout_request_id"
            )
        )

        payment.merchant_request_id = (
            result.get(
                "merchant_request_id"
            )
        )

        payment.result_description = (
            result.get(
                "response_description"
            )
        )

        db.session.commit()

        return jsonify({

            "message":
                "STK push initiated",

            "payment": {

                "id":
                    payment.id,

                "status":
                    payment.status,

                "amount":
                    payment.amount_kes,

                "phone":
                    payment.phone,

                "checkout_request_id":
                    payment.checkout_request_id,

                "merchant_request_id":
                    payment.merchant_request_id,

                "customer_message":
                    result.get(
                        "customer_message"
                    ),
            }

        }), 200

    except Exception as error:

        print(
            "Payment initiation error:",
            error
        )

        payment.status = PAYMENT_FAILED

        payment.result_description = str(
            error
        )

        db.session.commit()

        return jsonify({
            "message":
                "Failed to initiate payment",

            "error":
                str(error)
        }), 500


# =========================================================
# MPESA CALLBACK
# =========================================================

@mpesa_bp.route(
    "/mpesa/callback",
    methods=["POST"]
)
def mpesa_callback():

    data = request.get_json() or {}

    print("\n===== M-PESA CALLBACK =====")
    print(data)

    # -----------------------------------------------------
    # Parse Safaricom callback
    # -----------------------------------------------------

    callback = parse_callback(data)

    checkout_request_id = (
        callback.get(
            "checkout_request_id"
        )
    )

    result_code = (
        callback.get(
            "result_code"
        )
    )

    result_description = (
        callback.get(
            "result_description"
        )
    )

    # -----------------------------------------------------
    # Find payment
    # -----------------------------------------------------

    payment = Payment.query.filter_by(
        checkout_request_id=
            checkout_request_id
    ).first()

    if not payment:

        print(
            "Payment not found:",
            checkout_request_id
        )

        return jsonify({
            "ResultCode": 0,
            "ResultDesc":
                "Callback received"
        }), 200

    # =====================================================
    # SUCCESS
    # =====================================================

    if result_code == 0:

        payment.status = PAYMENT_PAID

        payment.mpesa_receipt = (
            callback.get(
                "receipt"
            )
        )

        payment.result_description = (
            result_description
        )

        payment.raw_callback = data

        payment.paid_at = utcnow()

        print(
            "\n===== PAYMENT SUCCESSFUL ====="
        )

        print(
            "Amount:",
            callback.get("amount")
        )

        print(
            "Receipt:",
            callback.get("receipt")
        )

        print(
            "Phone:",
            callback.get("phone")
        )

        print(
            "Date:",
            callback.get("transaction_date")
        )

    # =====================================================
    # FAILURE
    # =====================================================

    else:

        payment.status = PAYMENT_FAILED

        payment.result_description = (
            result_description
        )

        payment.raw_callback = data

        print(
            "\n===== PAYMENT FAILED ====="
        )

        print(
            "Result code:",
            result_code
        )

        print(
            "Reason:",
            result_description
        )

    # -----------------------------------------------------
    # Save payment
    # -----------------------------------------------------

    db.session.commit()

    # -----------------------------------------------------
    # Tell Safaricom we received callback
    # -----------------------------------------------------

    return jsonify({

        "ResultCode": 0,

        "ResultDesc":
            "Callback received successfully"

    }), 200