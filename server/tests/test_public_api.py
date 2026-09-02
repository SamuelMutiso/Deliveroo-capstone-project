import pytest

from app.resources import public as public_resource

NAIROBI = {
    "pickup_lat": -1.2609,
    "pickup_lng": 36.8027,
    "destination_lat": -1.3193,
    "destination_lng": 36.7085,
    "weight_category": "standard",
}


@pytest.fixture(autouse=True)
def fresh_throttle():
    public_resource._hits.clear()
    yield
    public_resource._hits.clear()


def test_the_weight_bands_are_public(client):
    response = client.get("/api/public/categories")

    assert response.status_code == 200
    values = [c["value"] for c in response.get_json()["categories"]]
    assert "envelope" in values
    assert "standard" in values


def test_a_visitor_can_price_a_route_without_signing_up(client):
    response = client.post("/api/public/quote", json=NAIROBI)

    assert response.status_code == 200
    body = response.get_json()
    assert body["quote"]["total"] > 0
    assert body["quote"]["lines"]
    assert body["route"]["distance_km"] > 0


def test_a_bad_weight_band_is_refused(client):
    response = client.post("/api/public/quote", json={**NAIROBI, "weight_category": "piano"})

    assert response.status_code == 422


def test_network_stats_are_public_and_hold_no_names(client):
    response = client.get("/api/public/stats")

    assert response.status_code == 200
    body = response.get_json()
    assert body["delivered"] == 0
    assert body["riders"] == 0
    assert "customer" not in body
    assert "orders" not in body


def test_stats_count_riders_and_deliveries(client, courier, as_admin, created_order):
    client.patch(
        f"/api/admin/orders/{created_order['id']}/assign",
        headers=as_admin,
        json={"courier_id": courier.id},
    )
    for status in ("picked_up", "in_transit", "delivered"):
        client.patch(
            f"/api/admin/orders/{created_order['id']}/status",
            headers=as_admin,
            json={"status": status},
        )

    body = client.get("/api/public/stats").get_json()

    assert body["delivered"] == 1
    assert body["riders"] == 1


def test_tracking_a_parcel_needs_no_account(client, created_order):
    response = client.get(f"/api/public/track/{created_order['tracking_code']}")

    assert response.status_code == 200
    parcel = response.get_json()["parcel"]
    assert parcel["tracking_code"] == created_order["tracking_code"]
    assert parcel["status"] == "pending"


def test_tracking_never_leaks_personal_details(client, created_order):
    parcel = client.get(
        f"/api/public/track/{created_order['tracking_code']}"
    ).get_json()["parcel"]

    for leak in (
        "pickup_address",
        "destination_address",
        "recipient_name",
        "recipient_phone",
        "recipient_email",
        "customer",
        "courier",
        "price_kes",
    ):
        assert leak not in parcel, f"{leak} must not be public"


def test_tracking_is_case_insensitive(client, created_order):
    response = client.get(f"/api/public/track/{created_order['tracking_code'].lower()}")

    assert response.status_code == 200


def test_an_unknown_tracking_code_is_a_404(client):
    response = client.get("/api/public/track/DLV-NOPE99")

    assert response.status_code == 404


def test_a_short_tracking_code_is_refused(client):
    response = client.get("/api/public/track/abc")

    assert response.status_code == 400


def test_the_public_api_is_rate_limited(client):
    for _ in range(public_resource.MAX_CALLS):
        assert client.get("/api/public/stats").status_code == 200

    assert client.get("/api/public/stats").status_code == 429
