import pytest

from app.models import User
from app.utils.phone import is_valid, normalise

ACCEPTED = ["0795038762", "0113422123", "+254712345678", "254712345678", "712345678", "0712 345 678"]
REFUSED = ["071234567", "07123456789", "0812345678", "abc", "", "+1 415 555 0134"]


@pytest.mark.parametrize("raw", ACCEPTED)
def test_a_kenyan_number_in_any_format_becomes_ten_digits(raw):
    assert is_valid(raw)
    cleaned = normalise(raw)
    assert len(cleaned) == 10 and cleaned.startswith(("07", "01"))


@pytest.mark.parametrize("raw", REFUSED)
def test_anything_else_is_refused(raw):
    assert not is_valid(raw)


def test_registering_stores_the_ten_digit_form(client):
    client.post(
        "/api/auth/register",
        json={
            "name": "New Customer",
            "email": "new@test.dev",
            "password": "password123",
            "phone": "+254712000111",
        },
    )

    assert User.query.filter_by(email="new@test.dev").one().phone == "0712000111"


def test_registering_with_a_bad_number_is_refused(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "New Customer",
            "email": "new@test.dev",
            "password": "password123",
            "phone": "0812345678",
        },
    )

    assert response.status_code == 422
    assert User.query.filter_by(email="new@test.dev").first() is None


def test_an_order_with_a_bad_recipient_number_is_refused(client, as_customer, order_payload):
    response = client.post(
        "/api/orders", headers=as_customer, json={**order_payload, "recipient_phone": "0733"}
    )

    assert response.status_code == 422


def test_a_profile_update_with_a_bad_number_is_refused(client, as_customer):
    response = client.patch("/api/auth/me", headers=as_customer, json={"phone": "not a phone"})

    assert response.status_code == 422


def test_a_checkout_with_a_bad_number_is_refused(client, as_customer, created_order):
    response = client.post(
        f"/api/payments/{created_order['id']}/mpesa",
        headers=as_customer,
        json={"phone": "12345"},
    )

    assert response.status_code == 422


def test_a_rider_application_with_a_bad_number_is_refused(client, as_customer):
    response = client.post(
        "/api/courier-applications",
        headers=as_customer,
        json={
            "full_name": "Kevin Omondi",
            "phone": "0812345678",
            "licence_number": "dl-99182",
            "vehicle_type": "motorbike",
            "vehicle_ownership": "company",
        },
    )

    assert response.status_code == 422
