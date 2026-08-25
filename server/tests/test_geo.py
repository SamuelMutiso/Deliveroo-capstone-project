KILIMANI = (-1.2960, 36.7818)
KAREN = (-1.3284, 36.7050)


def test_geo_endpoints_require_a_signed_in_user(client):
    assert client.get("/api/geo/search?q=Sarit").status_code == 401
    assert client.get("/api/geo/reverse?lat=-1.29&lng=36.78").status_code == 401
    assert client.post("/api/geo/route", json={}).status_code == 401


def test_search_returns_a_results_list(client, as_customer):
    response = client.get("/api/geo/search?q=Sarit%20Centre", headers=as_customer)
    assert response.status_code == 200
    assert isinstance(response.get_json()["results"], list)


def test_search_ignores_very_short_queries(client, as_customer):
    response = client.get("/api/geo/search?q=Sa", headers=as_customer)
    assert response.status_code == 200
    assert response.get_json()["results"] == []


def test_reverse_geocode_needs_numeric_coordinates(client, as_customer):
    assert client.get("/api/geo/reverse?lat=abc&lng=36.7", headers=as_customer).status_code == 400
    assert client.get("/api/geo/reverse?lng=36.7", headers=as_customer).status_code == 400


def test_reverse_geocode_returns_a_point(client, as_customer):
    response = client.get(
        f"/api/geo/reverse?lat={KILIMANI[0]}&lng={KILIMANI[1]}", headers=as_customer
    )
    assert response.status_code == 200
    body = response.get_json()
    assert round(body["lat"], 4) == round(KILIMANI[0], 4)
    assert body["address"]


def test_route_returns_distance_and_duration(client, as_customer):
    response = client.post(
        "/api/geo/route",
        json={
            "pickup_lat": KILIMANI[0],
            "pickup_lng": KILIMANI[1],
            "destination_lat": KAREN[0],
            "destination_lng": KAREN[1],
        },
        headers=as_customer,
    )
    assert response.status_code == 200
    route = response.get_json()["route"]
    assert route["distance_km"] > 0
    assert route["duration_min"] > 0
    assert "coordinates" in route


def test_route_rejects_missing_coordinates(client, as_customer):
    response = client.post(
        "/api/geo/route", json={"pickup_lat": KILIMANI[0]}, headers=as_customer
    )
    assert response.status_code == 400
