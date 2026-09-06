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


def test_the_receipt_arrives_when_the_payment_clears(
    client, as_customer, created_order, outbox
):
    payment = settle(client, as_customer, created_order)

    assert payment["status"] == PAYMENT_PAID
    assert wait_for_receipt(outbox), "no receipt after the payment cleared"


def test_the_receipt_does_not_wait_for_delivery(client, as_customer, created_order, outbox):
    settle(client, as_customer, created_order)

    body = wait_for_receipt(outbox)[0]["body"]
    assert "We have received" in body
    assert created_order["tracking_code"] in body


def test_a_confirmed_cash_payment_also_sends_the_receipt(
    client, as_admin, as_courier, courier, created_order, outbox
):
    client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )
    client.post(f"/api/courier/orders/{created_order['id']}/cash", headers=as_courier)

    assert receipts_in(outbox) == [], "a rider reporting cash is not a confirmed payment"

    client.patch(f"/api/admin/payments/{created_order['id']}/confirm", headers=as_admin)

    assert receipts_in(outbox), "no receipt after the admin confirmed the cash"


def test_a_receipt_is_only_ever_sent_once(client, as_customer, as_admin, courier, created_order, outbox):
    settle(client, as_customer, created_order)
    before = len(wait_for_receipt(outbox))
    assert before == 1

    client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )
    advance(client, as_admin, created_order["id"], "picked_up", "in_transit", "delivered")

    assert len(receipts_in(outbox)) == before, "delivery sent a second receipt"
