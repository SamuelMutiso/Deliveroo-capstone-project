from flask import Blueprint, request, jsonify

from ..extensions import db
from ..models.order import Order
from ..models.payment import Payment
from ..services.mpesa import stk_push
from ..utils.clock import utcnow

from ..constants import (
    PAYMENT_PENDING,
    PAYMENT_PROCESSING,
    PAYMENT_PAID,
    PAYMENT_FAILED,
)

mpesa_bp = Blueprint("mpesa", __name__)


@mpesa_bp.route("/api/payments/<int:order_id>/mpesa", methods=["POST"])
def initiate_payment(order_id):

    data = request.get_json() or {}

    phone = data.get("phone")

    if not phone:
        return jsonify({
            "message": "Phone number is required"
        }), 400

    # --------------------------------------------------------
    # Find order
    # --------------------------------------------------------

    order = Order.query.get(order_id)

    if not order:
        return jsonify({
            "message": "Order not found"
        }), 404

    # Check if payment already exists

    if order.payment:
        return jsonify({
            "message": "This order already has a payment",
            "payment": {
                "id": order.payment.id,
                "status": order.payment.status,
            }
        }), 400

    # Create pending payment

    payment = Payment(
        order_id=order.id,
        amount_kes=order.price_kes,
        method="mpesa",
        status=PAYMENT_PENDING,
        phone=phone,
    )

    db.session.add(payment)
    db.session.commit()

    # Send STK Push

    try:

        result = stk_push(
            phone_number=phone,
            amount=order.price_kes,
        )

        # Store Daraja response

        payment.status = PAYMENT_PROCESSING

        payment.checkout_request_id = result.get(
            "CheckoutRequestID"
        )

        payment.merchant_request_id = result.get(
            "MerchantRequestID"
        )

        payment.result_description = result.get(
            "ResponseDescription"
        )

        db.session.commit()

        return jsonify({
            "message": "STK push initiated",
            "payment": {
                "id": payment.id,
                "order_id": payment.order_id,
                "status": payment.status,
                "amount": payment.amount_kes,
                "phone": payment.phone,
                "checkout_request_id": payment.checkout_request_id,
                "merchant_request_id": payment.merchant_request_id,
                "customer_message": result.get(
                    "CustomerMessage"
                ),
            }
        }), 200

    except Exception as error:

        print("M-Pesa payment error:", error)

        payment.status = PAYMENT_FAILED
        payment.result_description = str(error)

        db.session.commit()

        return jsonify({
            "message": "Failed to initiate payment",
            "error": str(error),
        }), 500

# Mpesa Callback
# POST /mpesa/callback

@mpesa_bp.route("/mpesa/callback", methods=["POST"])
def mpesa_callback():

    data = request.get_json() or {}

    print("\n================================")
    print("       M-PESA CALLBACK")
    print("================================")
    print(data)

    # Extract STK callback

    callback = (
        data
        .get("Body", {})
        .get("stkCallback", {})
    )

    checkout_request_id = callback.get(
        "CheckoutRequestID"
    )

    merchant_request_id = callback.get(
        "MerchantRequestID"
    )

    result_code = callback.get(
        "ResultCode"
    )

    result_description = callback.get(
        "ResultDesc"
    )

    print("CheckoutRequestID:", checkout_request_id)
    print("MerchantRequestID:", merchant_request_id)
    print("ResultCode:", result_code)
    print("ResultDesc:", result_description)

    # Find payment using CheckoutRequestID

    payment = Payment.query.filter_by(
        checkout_request_id=checkout_request_id
    ).first()

    if not payment:

        print(
            "Payment not found:",
            checkout_request_id
        )

        # Still acknowledge callback to Safaricom
        return jsonify({
            "ResultCode": 0,
            "ResultDesc": "Callback received"
        }), 200

    # Success

    if result_code == 0:

        items = (
            callback
            .get("CallbackMetadata", {})
            .get("Item", [])
        )

        payment_data = {}

        for item in items:

            name = item.get("Name")

            if name:
                payment_data[name] = item.get("Value")

        # Save payment information

        payment.status = PAYMENT_PAID

        payment.mpesa_receipt = payment_data.get(
            "MpesaReceiptNumber"
        )

        payment.phone = payment_data.get(
            "PhoneNumber",
            payment.phone
        )

        payment.result_description = (
            result_description
        )

        payment.raw_callback = data

        payment.paid_at = utcnow()

        print("\n===== PAYMENT SUCCESSFUL =====")
        print("Amount:", payment_data.get("Amount"))
        print(
            "Receipt:",
            payment_data.get("MpesaReceiptNumber")
        )
        print(
            "Phone:",
            payment_data.get("PhoneNumber")
        )
        print(
            "Transaction Date:",
            payment_data.get("TransactionDate")
        )

    # FAILURE
    else:

        payment.status = PAYMENT_FAILED

        payment.result_description = (
            result_description
        )

        payment.raw_callback = data

        print("\n===== PAYMENT FAILED =====")
        print(
            "Reason:",
            result_description
        )
    # Save everything
    db.session.commit()

    
    # Tell Safaricom callback was received

    return jsonify({
        "ResultCode": 0,
        "ResultDesc": "Callback received successfully"
    }), 200