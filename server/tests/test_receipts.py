from app.services import receipts


def _deliver_and_pay(client, as_admin, as_customer, order_id, courier_id):
    client.patch(
        f"/api/admin/orders/{order_id}/assign",
        headers=as_admin,
        json={"courier_id": courier_id},
    )
    client.post(f"/api/payments/{order_id}/mpesa", headers=as_customer, json={"phone": "0712345678"})
    for status in ("picked_up", "in_transit", "delivered"):
        client.patch(
            f"/api/admin/orders/{order_id}/status", headers=as_admin, json={"status": status}
        )


def test_a_receipt_reference_verifies(app, client, as_admin, as_customer, courier, created_order):
    from app.extensions import db
    from app.models import Order

    _deliver_and_pay(client, as_admin, as_customer, created_order["id"], courier.id)

    with app.app_context():
        order = db.session.get(Order, created_order["id"])
        order.status = "delivered"
        reference = receipts.reference_for(order)

    response = client.get(f"/api/orders/verify/{reference}")
    body = response.get_json()

    assert response.status_code == 200
    assert body["valid"] is True
    assert body["receipt"]["tracking_code"] == created_order["tracking_code"]


def test_a_tampered_reference_is_rejected(
    app, client, as_admin, as_customer, courier, created_order
):
    from app.extensions import db
    from app.models import Order

    _deliver_and_pay(client, as_admin, as_customer, created_order["id"], courier.id)

    with app.app_context():
        order = db.session.get(Order, created_order["id"])
        reference = receipts.reference_for(order)

    tampered = reference[:-1] + ("a" if reference[-1] != "a" else "b")
    body = client.get(f"/api/orders/verify/{tampered}").get_json()

    assert body["valid"] is False


def test_a_nonsense_reference_is_rejected(client):
    assert client.get("/api/orders/verify/not-a-reference").get_json()["valid"] is False
    assert client.get("/api/orders/verify/DLV-NOPE-abcdef123456").get_json()["valid"] is False


def test_verification_needs_no_token(client):
    assert client.get("/api/orders/verify/DLV-XXXX-000000000000").status_code == 200
