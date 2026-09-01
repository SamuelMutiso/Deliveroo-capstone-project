import pytest

from app.constants import (
    METHOD_CASH,
    PAYMENT_CASH_PENDING,
    PAYMENT_PAID,
    PAYMENT_PENDING,
)
from app.services import notifications


@pytest.fixture
def outbox(monkeypatch):
    """Capture every notification instead of sending it."""
    sent = {"email": [], "sms": []}

    def fake_email(subject, recipient, body, html=None):
        if recipient:
            sent["email"].append({"to": recipient, "subject": subject, "body": body})
        return True

    def fake_sms(phone, message):
        if phone:
            sent["sms"].append({"to": phone, "message": message})
        return True

    monkeypatch.setattr(notifications.mailer, "send_email", fake_email)
    monkeypatch.setattr(notifications.sms, "send_sms", fake_sms)
    return sent


def _assign(client, as_admin, order_id, courier_id):
    return client.patch(
        f"/api/admin/orders/{order_id}/assign",
        headers=as_admin,
        json={"courier_id": courier_id},
    )


def test_a_rider_reports_cash_and_it_waits_for_an_admin(
    client, as_admin, as_courier, courier, created_order
):
    _assign(client, as_admin, created_order["id"], courier.id)

    response = client.post(
        f"/api/courier/orders/{created_order['id']}/cash", headers=as_courier
    )

    assert response.status_code == 202
    payment = response.get_json()["payment"]
    assert payment["status"] == PAYMENT_CASH_PENDING
    assert payment["method"] == METHOD_CASH


def test_a_rider_cannot_report_cash_on_someone_elses_delivery(
    client, as_courier, created_order
):
    response = client.post(
        f"/api/courier/orders/{created_order['id']}/cash", headers=as_courier
    )

    assert response.status_code == 403


def test_a_customer_cannot_confirm_their_own_payment(client, as_customer, created_order):
    response = client.patch(
        f"/api/admin/payments/{created_order['id']}/confirm", headers=as_customer
    )

    assert response.status_code == 403


def test_an_admin_confirms_a_cash_payment(
    client, as_admin, as_courier, as_customer, courier, created_order
):
    _assign(client, as_admin, created_order["id"], courier.id)
    client.post(f"/api/courier/orders/{created_order['id']}/cash", headers=as_courier)

    response = client.patch(
        f"/api/admin/payments/{created_order['id']}/confirm", headers=as_admin
    )

    assert response.status_code == 200
    payment = response.get_json()["payment"]
    assert payment["status"] == PAYMENT_PAID
    assert payment["method"] == METHOD_CASH
    assert payment["paid_at"] is not None

    seen = client.get(
        f"/api/payments/{created_order['id']}", headers=as_customer
    ).get_json()["payment"]
    assert seen["status"] == PAYMENT_PAID


def test_an_admin_can_confirm_without_the_rider_reporting_first(
    client, as_admin, created_order
):
    response = client.patch(
        f"/api/admin/payments/{created_order['id']}/confirm", headers=as_admin
    )

    assert response.status_code == 200
    assert response.get_json()["payment"]["status"] == PAYMENT_PAID


def test_a_confirmed_payment_cannot_be_confirmed_twice(client, as_admin, created_order):
    client.patch(f"/api/admin/payments/{created_order['id']}/confirm", headers=as_admin)

    response = client.patch(
        f"/api/admin/payments/{created_order['id']}/confirm", headers=as_admin
    )

    assert response.status_code == 409


def test_an_admin_turns_down_a_reported_cash_payment(
    client, as_admin, as_courier, courier, created_order
):
    _assign(client, as_admin, created_order["id"], courier.id)
    client.post(f"/api/courier/orders/{created_order['id']}/cash", headers=as_courier)

    response = client.patch(
        f"/api/admin/payments/{created_order['id']}/reject", headers=as_admin
    )

    assert response.status_code == 200
    assert response.get_json()["payment"]["status"] == PAYMENT_PENDING


def test_turning_down_a_payment_that_was_never_reported_is_rejected(
    client, as_admin, created_order
):
    response = client.patch(
        f"/api/admin/payments/{created_order['id']}/reject", headers=as_admin
    )

    assert response.status_code == 409


def test_a_rider_cannot_report_cash_once_the_order_is_paid(
    client, as_admin, as_courier, courier, created_order
):
    _assign(client, as_admin, created_order["id"], courier.id)
    client.patch(f"/api/admin/payments/{created_order['id']}/confirm", headers=as_admin)

    response = client.post(
        f"/api/courier/orders/{created_order['id']}/cash", headers=as_courier
    )

    assert response.status_code == 409


def test_confirming_a_cash_payment_emails_the_customer(
    client, as_admin, created_order, outbox
):
    client.patch(f"/api/admin/payments/{created_order['id']}/confirm", headers=as_admin)

    sent = [m for m in outbox["email"] if m["to"] == "amina@test.dev"]
    assert sent, "the customer was not emailed about the payment"
    assert any("cash" in m["body"].lower() for m in sent)
