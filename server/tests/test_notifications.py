import pytest

from app.services import notifications, sms


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


def emails_to(outbox, address):
    return [m for m in outbox["email"] if m["to"] == address]


def test_order_creation_notifies_customer_and_admin(
    client, as_customer, admin, order_payload, outbox
):
    order_payload["recipient_email"] = "joyce@test.dev"
    response = client.post("/api/orders", headers=as_customer, json=order_payload)
    assert response.status_code == 201

    assert emails_to(outbox, "amina@test.dev"), "customer was not emailed"
    assert emails_to(outbox, admin.email), "admin was not emailed"


def test_a_new_order_starts_with_no_rider(client, as_customer, order_payload):
    response = client.post("/api/orders", headers=as_customer, json=order_payload)

    assert response.status_code == 201
    assert response.get_json()["order"]["courier"] is None


def test_a_customer_cannot_request_a_rider(client, as_customer, courier, order_payload):
    order_payload["preferred_courier_id"] = courier.id
    response = client.post("/api/orders", headers=as_customer, json=order_payload)

    assert response.status_code >= 400


def test_a_customer_cannot_assign_a_rider(client, as_customer, courier, created_order):
    response = client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_customer,
        json={"courier_id": courier.id},
    )

    assert response.status_code == 403


def test_assignment_notifies_customer_and_rider(
    client, as_admin, courier, created_order, outbox
):
    response = client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )
    assert response.status_code == 200
    assert emails_to(outbox, "amina@test.dev"), "customer not told about the assignment"
    assert emails_to(outbox, courier.email), "rider not told about the assignment"


def test_delivery_notifies_customer_recipient_rider_and_admin(
    client, as_admin, as_courier, courier, admin, as_customer, order_payload, outbox
):
    order_payload["recipient_email"] = "joyce@test.dev"
    order = client.post("/api/orders", headers=as_customer, json=order_payload).get_json()["order"]

    client.patch(
        f"/api/admin/orders/{order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )
    for stage in ("picked_up", "in_transit", "delivered"):
        client.patch(
            f"/api/courier/orders/{order['id']}/status", headers=as_courier, json={"status": stage}
        )

    delivered = [m for m in outbox["email"] if "Delivered" in m["subject"]]
    told = {m["to"] for m in delivered}

    assert "amina@test.dev" in told, "customer not told about delivery"
    assert "joyce@test.dev" in told, "recipient not told about delivery"
    assert courier.email in told, "rider not told about delivery"
    assert admin.email in told, "admin not told about delivery"


def test_recipient_without_email_still_gets_sms(
    client, as_admin, as_courier, courier, as_customer, order_payload, outbox
):
    order = client.post("/api/orders", headers=as_customer, json=order_payload).get_json()["order"]
    client.patch(
        f"/api/admin/orders/{order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )
    client.patch(
        f"/api/courier/orders/{order['id']}/status", headers=as_courier, json={"status": "picked_up"}
    )

    texted = {m["to"] for m in outbox["sms"]}
    assert order_payload["recipient_phone"] in texted


def test_invalid_recipient_email_is_rejected(client, as_customer, order_payload):
    order_payload["recipient_email"] = "not-an-email"
    response = client.post("/api/orders", headers=as_customer, json=order_payload)
    assert response.status_code == 422


def test_couriers_endpoint_hides_contact_details(client, as_customer, courier):
    response = client.get("/api/orders/couriers", headers=as_customer)
    body = response.get_json()

    assert response.status_code == 200
    listed = [c for c in body["couriers"] if c["id"] == courier.id]
    assert listed, "active courier missing from the list"
    assert "email" not in listed[0]
    assert "phone" not in listed[0]


def test_deactivated_courier_is_not_listed(client, db, as_customer, courier):
    courier.is_active = False
    db.session.commit()

    body = client.get("/api/orders/couriers", headers=as_customer).get_json()
    assert all(c["id"] != courier.id for c in body["couriers"])


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("0712345678", "+254712345678"),
        ("254712345678", "+254712345678"),
        ("+254 712 345 678", "+254712345678"),
        ("0112345678", "+254112345678"),
        ("12345", None),
        ("", None),
    ],
)
def test_sms_phone_normalisation(app, raw, expected):
    with app.app_context():
        assert sms.normalise_phone(raw) == expected
