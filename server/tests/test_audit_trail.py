import pytest

from app.models import AuditEvent
from app.services import audit

TINY_PNG = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8"
    "z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


def actions_recorded():
    return [event.action for event in AuditEvent.query.all()]


def test_nothing_is_recorded_until_someone_uses_their_authority(created_order):
    assert actions_recorded() == []


def test_assigning_a_rider_is_recorded(client, as_admin, courier, created_order, admin):
    client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )

    event = AuditEvent.query.filter_by(action=audit.ORDER_ASSIGNED).one()
    assert event.actor_name == admin.name
    assert event.actor_role == "admin"
    assert event.subject_id == created_order["tracking_code"]
    assert courier.name in event.summary


def test_forcing_a_status_is_recorded(client, as_admin, created_order):
    client.patch(
        f"/api/admin/orders/{created_order['id']}/status",
        headers=as_admin,
        json={"status": "cancelled"},
    )

    event = AuditEvent.query.filter_by(action=audit.ORDER_STATUS_FORCED).one()
    assert "cancelled" in event.summary


def test_confirming_cash_records_who_did_it(
    client, as_admin, as_courier, courier, created_order, admin
):
    client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )
    client.post(f"/api/courier/orders/{created_order['id']}/cash", headers=as_courier)
    client.patch(f"/api/admin/payments/{created_order['id']}/confirm", headers=as_admin)

    event = AuditEvent.query.filter_by(action=audit.PAYMENT_CONFIRMED).one()
    assert event.actor_name == admin.name
    assert event.subject_id == created_order["tracking_code"]


def test_deactivating_an_account_is_recorded(client, as_admin, customer):
    client.patch(
        f"/api/admin/users/{customer.id}", headers=as_admin, json={"is_active": False}
    )

    event = AuditEvent.query.filter_by(action=audit.USER_UPDATED).one()
    assert customer.name in event.summary
    assert "is_active" in event.summary


def test_approving_a_rider_is_recorded(client, as_admin, as_customer):
    application = client.post(
        "/api/courier-applications",
        headers=as_customer,
        json={
            "full_name": "Kevin Omondi",
            "phone": "0722555111",
            "licence_number": "dl-99182",
            "vehicle_type": "motorbike",
            "vehicle_ownership": "company",
            "profile_photo_url": TINY_PNG,
        },
    ).get_json()["application"]

    client.patch(
        f"/api/admin/courier-applications/{application['id']}/approve",
        headers=as_admin,
        json={},
    )

    event = AuditEvent.query.filter_by(action=audit.RIDER_APPROVED).one()
    assert "Kevin Omondi" in event.summary


def test_an_admin_can_read_the_trail(client, as_admin, courier, created_order):
    client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )

    response = client.get("/api/admin/audit", headers=as_admin)

    assert response.status_code == 200
    items = response.get_json()["items"]
    assert items[0]["action"] == audit.ORDER_ASSIGNED
    assert items[0]["actor_name"]


def test_the_trail_can_be_filtered(client, as_admin, courier, created_order):
    client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )
    client.patch(
        f"/api/admin/orders/{created_order['id']}/status",
        headers=as_admin,
        json={"status": "cancelled"},
    )

    body = client.get(
        f"/api/admin/audit?action={audit.ORDER_ASSIGNED}", headers=as_admin
    ).get_json()

    assert [item["action"] for item in body["items"]] == [audit.ORDER_ASSIGNED]


def test_a_customer_cannot_read_the_trail(client, as_customer):
    assert client.get("/api/admin/audit", headers=as_customer).status_code == 403


def test_a_courier_cannot_read_the_trail(client, as_courier):
    assert client.get("/api/admin/audit", headers=as_courier).status_code == 403


def test_an_audit_failure_never_undoes_the_work(client, as_admin, courier, created_order, monkeypatch):
    """The action is what matters. A broken log must not roll back a real assignment."""
    def explode(*_args, **_kwargs):
        raise RuntimeError("the audit store is down")

    monkeypatch.setattr(audit, "AuditEvent", explode)

    response = client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )

    assert response.status_code == 200
    assert response.get_json()["order"]["courier"]["id"] == courier.id
    assert AuditEvent.query.count() == 0, "a failed write must not leave a half record"
