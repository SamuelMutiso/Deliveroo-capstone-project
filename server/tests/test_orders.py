def test_create_order_prices_and_tracks_it(client, as_customer, order_payload):
    response = client.post("/api/orders", headers=as_customer, json=order_payload)
    order = response.get_json()["order"]

    assert response.status_code == 201
    assert order["status"] == "pending"
    assert order["tracking_code"].startswith("DLV-")
    assert order["distance_km"] > 0
    assert order["price_kes"] > 0
    assert len(order["events"]) == 1


def test_create_order_rejects_weight_above_category_limit(client, as_customer, order_payload):
    order_payload.update({"weight_category": "light", "weight_kg": 30})
    response = client.post("/api/orders", headers=as_customer, json=order_payload)
    assert response.status_code == 422


def test_create_order_validates_required_fields(client, as_customer):
    response = client.post("/api/orders", headers=as_customer, json={"pickup_address": "x"})
    assert response.status_code == 422
    assert "destination_lat" in response.get_json()["errors"]


def test_orders_list_is_paginated(client, as_customer, order_payload):
    for _ in range(3):
        client.post("/api/orders", headers=as_customer, json=order_payload)

    response = client.get("/api/orders?page=1&per_page=2", headers=as_customer)
    body = response.get_json()

    assert response.status_code == 200
    assert len(body["items"]) == 2
    assert body["meta"]["total"] == 3
    assert body["meta"]["pages"] == 2
    assert body["meta"]["has_next"] is True


def test_customer_only_sees_their_own_orders(client, as_customer, as_other_customer, order_payload):
    client.post("/api/orders", headers=as_customer, json=order_payload)

    response = client.get("/api/orders", headers=as_other_customer)
    assert response.get_json()["meta"]["total"] == 0


def test_customer_cannot_read_another_customers_order(client, as_other_customer, created_order):
    response = client.get(f"/api/orders/{created_order['id']}", headers=as_other_customer)
    assert response.status_code == 403


def test_customer_cannot_cancel_another_customers_order(client, as_other_customer, created_order):
    response = client.patch(f"/api/orders/{created_order['id']}/cancel", headers=as_other_customer)
    assert response.status_code == 403


def test_changing_destination_reprices_the_order(client, as_customer, created_order):
    response = client.patch(
        f"/api/orders/{created_order['id']}/destination",
        headers=as_customer,
        json={
            "destination_address": "JKIA Cargo Terminal",
            "destination_lat": -1.3192,
            "destination_lng": 36.9278,
        },
    )
    updated = response.get_json()["order"]

    assert response.status_code == 200
    assert updated["destination_address"] == "JKIA Cargo Terminal"
    assert updated["distance_km"] != created_order["distance_km"]
    assert updated["price_kes"] != created_order["price_kes"]


def test_cancelling_then_cancelling_again_conflicts(client, as_customer, created_order):
    first = client.patch(f"/api/orders/{created_order['id']}/cancel", headers=as_customer)
    second = client.patch(f"/api/orders/{created_order['id']}/cancel", headers=as_customer)

    assert first.status_code == 200
    assert first.get_json()["order"]["status"] == "cancelled"
    assert second.status_code == 409


def test_destination_cannot_change_once_cancelled(client, as_customer, created_order):
    client.patch(f"/api/orders/{created_order['id']}/cancel", headers=as_customer)

    response = client.patch(
        f"/api/orders/{created_order['id']}/destination",
        headers=as_customer,
        json={
            "destination_address": "Kikuyu Town",
            "destination_lat": -1.2464,
            "destination_lng": 36.6636,
        },
    )
    assert response.status_code == 409


def test_courier_cannot_reach_admin_routes(client, as_courier):
    assert client.get("/api/admin/orders", headers=as_courier).status_code == 403


def test_customer_cannot_reach_admin_routes(client, as_customer):
    assert client.get("/api/admin/stats", headers=as_customer).status_code == 403


def test_admin_assigns_a_courier(client, as_admin, courier, created_order):
    response = client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )
    assert response.status_code == 200
    assert response.get_json()["order"]["courier"]["id"] == courier.id


def test_courier_only_sees_assigned_deliveries(client, as_admin, as_courier, courier, created_order):
    before = client.get("/api/courier/orders", headers=as_courier)
    assert before.get_json()["meta"]["total"] == 0

    client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )

    after = client.get("/api/courier/orders", headers=as_courier)
    assert after.get_json()["meta"]["total"] == 1


def test_courier_status_must_follow_the_stage_order(client, as_admin, as_courier, courier, created_order):
    order_id = created_order["id"]
    client.patch(
        f"/api/admin/orders/{order_id}/assign", headers=as_admin, json={"courier_id": courier.id}
    )

    skipped = client.patch(
        f"/api/courier/orders/{order_id}/status", headers=as_courier, json={"status": "delivered"}
    )
    assert skipped.status_code == 409

    for stage in ("picked_up", "in_transit", "delivered"):
        step = client.patch(
            f"/api/courier/orders/{order_id}/status", headers=as_courier, json={"status": stage}
        )
        assert step.status_code == 200
        assert step.get_json()["order"]["status"] == stage


def test_courier_location_update_appends_a_tracking_event(
    client, as_admin, as_courier, courier, created_order
):
    order_id = created_order["id"]
    client.patch(
        f"/api/admin/orders/{order_id}/assign", headers=as_admin, json={"courier_id": courier.id}
    )

    response = client.patch(
        f"/api/courier/orders/{order_id}/location",
        headers=as_courier,
        json={"lat": -1.3, "lng": 36.85},
    )
    order = response.get_json()["order"]

    assert response.status_code == 200
    assert order["current_lat"] == -1.3
    assert order["events"][-1]["lat"] == -1.3


def test_admin_stats_report_totals(client, as_admin, created_order):
    response = client.get("/api/admin/stats", headers=as_admin)
    body = response.get_json()

    assert response.status_code == 200
    assert body["totals"]["orders"] == 1
    assert body["totals"]["unassigned"] == 1
    assert len(body["daily"]) == 7


def test_quote_endpoint_returns_a_breakdown(client, as_customer):
    response = client.post(
        "/api/orders/quote",
        headers=as_customer,
        json={
            "pickup_lat": -1.2609,
            "pickup_lng": 36.8027,
            "destination_lat": -1.3193,
            "destination_lng": 36.7085,
            "weight_category": "heavy",
            "weight_kg": 12,
        },
    )
    body = response.get_json()

    assert response.status_code == 200
    assert body["quote"]["total"] > 0
    assert body["route"]["distance_km"] > 0
    assert len(body["quote"]["lines"]) >= 4