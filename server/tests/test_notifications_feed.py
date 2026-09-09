def test_placing_an_order_notifies_the_customer_and_the_admin(
    client, as_customer, as_admin, created_order
):
    customer_feed = client.get("/api/notifications", headers=as_customer).get_json()
    admin_feed = client.get("/api/notifications", headers=as_admin).get_json()

    assert customer_feed["unread"] == 1
    assert customer_feed["items"][0]["event"] == "order_created"
    assert customer_feed["items"][0]["tracking_code"] == created_order["tracking_code"]

    assert admin_feed["unread"] == 1
    assert admin_feed["items"][0]["event"] == "order_created"


def test_a_courier_is_notified_when_an_order_is_assigned(
    client, as_admin, as_courier, courier, created_order
):
    client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )

    feed = client.get("/api/notifications", headers=as_courier).get_json()

    assert feed["unread"] == 1
    assert feed["items"][0]["event"] == "courier_assigned"
    assert created_order["pickup_address"] in feed["items"][0]["body"]


def test_a_customer_is_notified_at_every_delivery_stage(
    client, as_admin, as_customer, courier, created_order
):
    order_id = created_order["id"]
    client.patch(
        f"/api/admin/orders/{order_id}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )
    for status in ("picked_up", "in_transit", "delivered"):
        client.patch(
            f"/api/admin/orders/{order_id}/status", headers=as_admin, json={"status": status}
        )

    feed = client.get("/api/notifications", headers=as_customer).get_json()
    events = [item["event"] for item in feed["items"]]

    assert events[:4] == ["delivered", "in_transit", "picked_up", "courier_assigned"]
    assert feed["unread"] == 5


def test_marking_one_notification_read_lowers_the_unread_count(
    client, as_customer, created_order
):
    feed = client.get("/api/notifications", headers=as_customer).get_json()
    first = feed["items"][0]["id"]

    response = client.patch(f"/api/notifications/{first}/read", headers=as_customer)

    assert response.status_code == 200
    assert response.get_json()["notification"]["is_read"] is True
    assert client.get("/api/notifications/unread-count", headers=as_customer).get_json()["unread"] == 0


def test_read_all_clears_the_badge(client, as_admin, as_customer, courier, created_order):
    client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )

    response = client.post("/api/notifications/read-all", headers=as_customer)

    assert response.get_json()["unread"] == 0
    assert client.get("/api/notifications", headers=as_customer).get_json()["unread"] == 0


def test_a_customer_never_sees_another_customers_notifications(
    client, as_other_customer, created_order
):
    feed = client.get("/api/notifications", headers=as_other_customer).get_json()

    assert feed["items"] == []
    assert feed["unread"] == 0


def test_notifications_require_a_token(client):
    assert client.get("/api/notifications").status_code == 401
