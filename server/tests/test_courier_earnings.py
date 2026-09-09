from app.constants import STATUS_DELIVERED


def _deliver(client, as_admin, order_id, courier_id):
    client.patch(
        f"/api/admin/orders/{order_id}/assign",
        headers=as_admin,
        json={"courier_id": courier_id},
    )
    for status in ("picked_up", "in_transit", STATUS_DELIVERED):
        client.patch(
            f"/api/admin/orders/{order_id}/status", headers=as_admin, json={"status": status}
        )


def test_a_courier_with_no_deliveries_earns_nothing(client, as_courier):
    stats = client.get("/api/courier/stats", headers=as_courier).get_json()

    assert stats["earnings"]["today"] == 0
    assert stats["earnings"]["lifetime"] == 0
    assert len(stats["daily"]) == 7


def test_earnings_are_the_commission_share_of_delivered_orders(
    client, as_admin, as_courier, courier, created_order
):
    _deliver(client, as_admin, created_order["id"], courier.id)

    stats = client.get("/api/courier/stats", headers=as_courier).get_json()
    expected = round(created_order["price_kes"] * stats["commission_rate"], 2)

    assert stats["earnings"]["today"] == expected
    assert stats["earnings"]["week"] == expected
    assert stats["earnings"]["lifetime"] == expected
    assert stats["delivered"] == 1


def test_the_daily_series_covers_seven_days_and_ends_today(
    client, as_admin, as_courier, courier, created_order
):
    _deliver(client, as_admin, created_order["id"], courier.id)

    daily = client.get("/api/courier/stats", headers=as_courier).get_json()["daily"]

    assert len(daily) == 7
    assert daily[-1]["deliveries"] == 1
    assert daily[-1]["earnings_kes"] > 0
    assert sum(day["deliveries"] for day in daily[:-1]) == 0


def test_an_undelivered_order_pays_nothing(client, as_admin, as_courier, courier, created_order):
    client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )
    client.patch(
        f"/api/admin/orders/{created_order['id']}/status",
        headers=as_admin,
        json={"status": "picked_up"},
    )

    stats = client.get("/api/courier/stats", headers=as_courier).get_json()

    assert stats["earnings"]["lifetime"] == 0
    assert stats["active"] == 1


def test_the_admin_is_notified_when_a_parcel_is_collected_and_in_transit(
    client, as_admin, courier, created_order
):
    client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )
    for status in ("picked_up", "in_transit"):
        client.patch(
            f"/api/admin/orders/{created_order['id']}/status",
            headers=as_admin,
            json={"status": status},
        )

    events = [
        item["event"]
        for item in client.get("/api/notifications", headers=as_admin).get_json()["items"]
    ]

    assert "in_transit" in events
    assert "picked_up" in events
