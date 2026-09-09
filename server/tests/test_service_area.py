import pytest

from app.utils import geofence

MOMBASA = (-4.0435, 39.6682)
NAKURU = (-0.3031, 36.0800)
KAREN = (-1.3193, 36.7085)
SARIT = (-1.2609, 36.8027)


def test_nairobi_points_are_inside(app):
    assert geofence.contains(*KAREN)
    assert geofence.contains(*SARIT)


@pytest.mark.parametrize("point", [MOMBASA, NAKURU])
def test_other_counties_are_outside(app, point):
    assert not geofence.contains(*point)


def test_the_search_box_is_the_service_area(app):
    box = geofence.bounds()
    west, north, east, south = geofence.viewbox().split(",")

    assert float(west) == box["west"]
    assert float(north) == box["north"]
    assert float(east) == box["east"]
    assert float(south) == box["south"]


def test_a_parcel_cannot_be_booked_out_of_area(client, as_customer, order_payload):
    order_payload["destination_lat"], order_payload["destination_lng"] = MOMBASA

    response = client.post("/api/orders", headers=as_customer, json=order_payload)

    assert response.status_code == 422
    assert "destination_lat" in response.get_json()["errors"]


def test_a_pickup_outside_nairobi_is_refused(client, as_customer, order_payload):
    order_payload["pickup_lat"], order_payload["pickup_lng"] = NAKURU

    response = client.post("/api/orders", headers=as_customer, json=order_payload)

    assert response.status_code == 422
    assert "pickup_lat" in response.get_json()["errors"]


def test_the_limit_is_enforced_on_the_api_not_just_the_map(client, as_customer, order_payload):
    """Posting straight to the API, with no address search involved, still gets refused."""
    order_payload["pickup_address"] = "Somewhere in Nairobi, honestly"
    order_payload["pickup_lat"], order_payload["pickup_lng"] = MOMBASA

    response = client.post("/api/orders", headers=as_customer, json=order_payload)

    assert response.status_code == 422


def test_a_public_quote_outside_the_area_is_refused(client):
    response = client.post(
        "/api/public/quote",
        json={
            "pickup_lat": KAREN[0],
            "pickup_lng": KAREN[1],
            "destination_lat": MOMBASA[0],
            "destination_lng": MOMBASA[1],
            "weight_category": "standard",
        },
    )

    assert response.status_code == 422


def test_the_error_names_the_area(client, as_customer, order_payload):
    order_payload["destination_lat"], order_payload["destination_lng"] = MOMBASA

    message = client.post("/api/orders", headers=as_customer, json=order_payload).get_json()

    assert "Nairobi County" in message["errors"]["destination_lat"][0]


def test_a_destination_cannot_be_moved_out_of_area(client, as_customer, created_order):
    response = client.patch(
        f"/api/orders/{created_order['id']}/destination",
        headers=as_customer,
        json={
            "destination_address": "Nyali Beach, Mombasa",
            "destination_lat": MOMBASA[0],
            "destination_lng": MOMBASA[1],
        },
    )

    assert response.status_code == 422
