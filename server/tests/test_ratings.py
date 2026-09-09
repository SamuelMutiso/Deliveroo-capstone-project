def _deliver(client, as_admin, order_id, courier_id, received_by=None):
    client.patch(
        f"/api/admin/orders/{order_id}/assign",
        headers=as_admin,
        json={"courier_id": courier_id},
    )
    for status in ("picked_up", "in_transit", "delivered"):
        client.patch(
            f"/api/admin/orders/{order_id}/status", headers=as_admin, json={"status": status}
        )


def test_a_delivered_order_can_be_rated_once(
    client, as_admin, as_customer, courier, created_order
):
    _deliver(client, as_admin, created_order["id"], courier.id)

    response = client.post(
        f"/api/orders/{created_order['id']}/rating",
        headers=as_customer,
        json={"rating": 5, "comment": "Fast and polite"},
    )

    assert response.status_code == 200
    order = response.get_json()["order"]
    assert order["rating"] == 5
    assert order["rating_comment"] == "Fast and polite"
    assert order["rated_at"] is not None

    again = client.post(
        f"/api/orders/{created_order['id']}/rating", headers=as_customer, json={"rating": 3}
    )
    assert again.status_code == 409


def test_an_undelivered_order_cannot_be_rated(client, as_customer, created_order):
    response = client.post(
        f"/api/orders/{created_order['id']}/rating", headers=as_customer, json={"rating": 5}
    )

    assert response.status_code == 409


def test_a_rating_must_be_between_one_and_five(
    client, as_admin, as_customer, courier, created_order
):
    _deliver(client, as_admin, created_order["id"], courier.id)

    assert (
        client.post(
            f"/api/orders/{created_order['id']}/rating", headers=as_customer, json={"rating": 9}
        ).status_code
        == 422
    )


def test_another_customer_cannot_rate_your_delivery(
    client, as_admin, as_other_customer, courier, created_order
):
    _deliver(client, as_admin, created_order["id"], courier.id)

    response = client.post(
        f"/api/orders/{created_order['id']}/rating", headers=as_other_customer, json={"rating": 1}
    )

    assert response.status_code in (403, 404)


def test_the_courier_average_rating_reflects_the_ratings_given(
    client, as_admin, as_customer, as_courier, courier, created_order
):
    _deliver(client, as_admin, created_order["id"], courier.id)
    client.post(
        f"/api/orders/{created_order['id']}/rating", headers=as_customer, json={"rating": 4}
    )

    stats = client.get("/api/courier/stats", headers=as_courier).get_json()

    assert stats["rating"]["average"] == 4.0
    assert stats["rating"]["count"] == 1


def test_a_courier_records_who_received_the_parcel(
    client, as_admin, as_courier, courier, created_order
):
    order_id = created_order["id"]
    client.patch(
        f"/api/admin/orders/{order_id}/assign", headers=as_admin, json={"courier_id": courier.id}
    )
    client.patch(
        f"/api/courier/orders/{order_id}/status", headers=as_courier, json={"status": "picked_up"}
    )
    client.patch(
        f"/api/courier/orders/{order_id}/status", headers=as_courier, json={"status": "in_transit"}
    )

    response = client.patch(
        f"/api/courier/orders/{order_id}/status",
        headers=as_courier,
        json={"status": "delivered", "received_by": "Grace at reception"},
    )

    assert response.status_code == 200
    order = response.get_json()["order"]
    assert order["received_by"] == "Grace at reception"
    assert any("Grace at reception" in (event["note"] or "") for event in order["events"])
