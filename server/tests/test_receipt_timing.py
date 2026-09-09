import time

import pytest

from app.constants import PAYMENT_PAID
from app.resources import payments as payments_resource
from app.services import notifications


@pytest.fixture(autouse=True)
def instant_settle(monkeypatch):
    monkeypatch.setattr(payments_resource, "SIMULATED_SETTLE_SECONDS", 0)


@pytest.fixture
def outbox(monkeypatch):
    """Capture mail from the moment this fixture is set up."""
    sent = []

    def fake_email(subject, recipient, body, html=None):
        if recipient:
            sent.append({"to": recipient, "subject": subject, "body": body})
        return True

    monkeypatch.setattr(notifications.mailer, "send_email", fake_email)
    monkeypatch.setattr(notifications.sms, "send_sms", lambda *args, **kwargs: True)
    return sent


def receipts_in(outbox):
    return [message for message in outbox if message["subject"].startswith("Receipt ·")]


def settle(client, headers, order):
    client.post(
        f"/api/payments/{order['id']}/mpesa", headers=headers, json={"phone": "0712345678"}
    )
    for _ in range(40):
        payment = client.get(f"/api/payments/{order['id']}", headers=headers).get_json()[
            "payment"
        ]
        if payment["status"] == PAYMENT_PAID:
            return payment
        time.sleep(0.1)
    return payment


def wait_for_receipt(outbox, timeout=4.0):
    """The simulated settlement runs on a thread, so give the receipt a moment to land."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        found = receipts_in(outbox)
        if found:
            return found
        time.sleep(0.05)
    return receipts_in(outbox)


def advance(client, headers, order_id, *statuses):
    for status in statuses:
        client.patch(
            f"/api/admin/orders/{order_id}/status", headers=headers, json={"status": status}
        )


def test_booking_a_parcel_sends_no_receipt(created_order, outbox):
    assert receipts_in(outbox) == []


def test_delivering_an_unpaid_parcel_sends_no_receipt(
    client, as_admin, courier, created_order, outbox
):
    client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )
    advance(client, as_admin, created_order["id"], "picked_up", "in_transit", "delivered")

    assert receipts_in(outbox) == [], "a receipt went out before anyone paid"


def test_paying_early_does_not_send_a_receipt_yet(client, as_customer, created_order, outbox):
    payment = settle(client, as_customer, created_order)

    assert payment["status"] == PAYMENT_PAID
    assert wait_for_receipt(outbox, timeout=1.0) == [], "a receipt went out before delivery"


def test_the_receipt_arrives_once_the_parcel_is_paid_and_delivered(
    client, as_customer, as_admin, courier, created_order, outbox
):
    settle(client, as_customer, created_order)
    client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )
    advance(client, as_admin, created_order["id"], "picked_up", "in_transit", "delivered")

    found = wait_for_receipt(outbox)
    assert found, "no receipt once both conditions were met"
    assert created_order["tracking_code"] in found[0]["body"]
    assert "Delivered to" in found[0]["body"]


def test_cash_confirmed_after_delivery_sends_the_receipt(
    client, as_admin, as_courier, courier, created_order, outbox
):
    client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )
    client.post(f"/api/courier/orders/{created_order['id']}/cash", headers=as_courier)
    advance(client, as_admin, created_order["id"], "picked_up", "in_transit", "delivered")

    assert receipts_in(outbox) == [], "a rider reporting cash is not a confirmed payment"

    client.patch(f"/api/admin/payments/{created_order['id']}/confirm", headers=as_admin)

    assert receipts_in(outbox), "no receipt after the admin confirmed the cash"


def test_a_receipt_is_only_ever_sent_once(
    client, as_customer, as_admin, courier, created_order, outbox
):
    settle(client, as_customer, created_order)
    client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )
    advance(client, as_admin, created_order["id"], "picked_up", "in_transit", "delivered")

    before = len(wait_for_receipt(outbox))
    assert before == 1

    advance(client, as_admin, created_order["id"], "delivered")

    assert len(receipts_in(outbox)) == before, "a repeated status change sent a second receipt"
