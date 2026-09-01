from app.services import pricing


def test_the_envelope_band_is_the_cheapest_option(app):
    with app.app_context():
        envelope = pricing.quote(1.0, "envelope")
        light = pricing.quote(1.0, "light")

    assert envelope["total"] < light["total"]
    assert envelope["category_label"] == "Envelope"


def test_a_very_short_envelope_run_is_about_a_hundred_shillings(app):
    with app.app_context():
        quote = pricing.quote(0.3, "envelope")

    assert 90 <= quote["total"] <= 120


def test_an_envelope_over_one_kilo_is_refused(app):
    from app.utils.errors import ApiError
    import pytest

    with app.app_context():
        with pytest.raises(ApiError):
            pricing.quote(2.0, "envelope", weight_kg=1.6)


def test_the_catalogue_offers_the_envelope_band(client, as_customer):
    catalogue = client.get("/api/orders/categories", headers=as_customer).get_json()
    values = [item["value"] for item in catalogue["categories"]]

    assert "envelope" in values
    assert values[0] == "envelope"


def test_an_envelope_order_can_be_placed(client, as_customer, order_payload):
    order_payload["weight_category"] = "envelope"
    order_payload["weight_kg"] = 0.4

    response = client.post("/api/orders", headers=as_customer, json=order_payload)

    assert response.status_code == 201
    assert response.get_json()["order"]["weight_category"] == "envelope"
