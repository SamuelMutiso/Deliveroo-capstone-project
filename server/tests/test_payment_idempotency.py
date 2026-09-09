import threading
import time

import pytest

from app.constants import PAYMENT_PAID, PAYMENT_PROCESSING
from app.extensions import db
from app.models import Payment
from app.resources import payments as payments_resource
from app.services import notifications


@pytest.fixture(autouse=True)
def never_settle(monkeypatch):
    """Keep the payment sitting at processing so the double tap is what gets tested."""
    monkeypatch.setattr(payments_resource, "_settle_simulated_payment", lambda *a, **k: None)


@pytest.fixture
def outbox(monkeypatch):
    sent = []
    monkeypatch.setattr(
        notifications.mailer,
        "send_email",
        lambda subject, recipient, body, html=None: sent.append(subject) or True,
    )
    monkeypatch.setattr(notifications.sms, "send_sms", lambda *a, **k: True)
    return sent


def checkout_id_of(order):
    return Payment.query.filter_by(order_id=order["id"]).one().checkout_request_id


def checkout(client, headers, order):
    return client.post(
        f"/api/payments/{order['id']}/mpesa", headers=headers, json={"phone": "0712345678"}
    )


def test_a_double_tap_does_not_send_a_second_prompt(client, as_customer, created_order):
    first = checkout(client, as_customer, created_order)
    second = checkout(client, as_customer, created_order)

    assert first.status_code == 202
    assert second.status_code == 202
    assert second.get_json()["reused"] is True
    assert (
        second.get_json()["payment"]["id"] == first.get_json()["payment"]["id"]
    ), "the customer was sent a second prompt for the same order"


def test_a_double_tap_leaves_one_payment_row(client, as_customer, created_order):
    checkout(client, as_customer, created_order)
    checkout(client, as_customer, created_order)

    assert Payment.query.filter_by(order_id=created_order["id"]).count() == 1


def test_a_stale_prompt_can_be_retried(client, as_customer, created_order, app):
    first = checkout(client, as_customer, created_order)
    payment = Payment.query.filter_by(order_id=created_order["id"]).one()
    payment.updated_at = payment.updated_at - payments_resource.PROMPT_HOLD * 2
    db.session.commit()

    second = checkout(client, as_customer, created_order)

    assert second.get_json().get("reused") is not True, "a stale prompt should be resendable"
    assert second.status_code == 202
    assert first.get_json()["payment"]["status"] == PAYMENT_PROCESSING


def callback_for(checkout_request_id, receipt="TEST12345"):
    return {
        "Body": {
            "stkCallback": {
                "CheckoutRequestID": checkout_request_id,
                "ResultCode": 0,
                "CallbackMetadata": {"Item": [{"Name": "MpesaReceiptNumber", "Value": receipt}]},
            }
        }
    }


def test_a_retried_callback_settles_the_payment_once(client, as_customer, created_order, outbox):
    checkout(client, as_customer, created_order)
    payload = callback_for(checkout_id_of(created_order))

    client.post("/api/payments/mpesa/callback", json=payload)
    for thread in threading.enumerate():
        if thread is not threading.current_thread():
            thread.join(timeout=2)
    after_first = list(outbox)

    second = client.post("/api/payments/mpesa/callback", json=payload)

    assert second.status_code == 200
    assert second.get_json()["ResultDesc"] == "Already recorded"
    assert outbox == after_first, "a retried callback told everyone a second time"


def test_a_retried_callback_cannot_overwrite_the_receipt(client, as_customer, created_order):
    checkout(client, as_customer, created_order)
    checkout_id = checkout_id_of(created_order)

    client.post("/api/payments/mpesa/callback", json=callback_for(checkout_id, "GENUINE1"))
    client.post("/api/payments/mpesa/callback", json=callback_for(checkout_id, "FORGED2"))

    payment = Payment.query.filter_by(order_id=created_order["id"]).one()
    assert payment.status == PAYMENT_PAID
    assert payment.mpesa_receipt == "GENUINE1"


def test_an_unknown_checkout_is_shrugged_off(client):
    response = client.post("/api/payments/mpesa/callback", json=callback_for("nope-not-ours"))

    assert response.status_code == 200
    assert response.get_json()["ResultDesc"] == "Unknown checkout"
