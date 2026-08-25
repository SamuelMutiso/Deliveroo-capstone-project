import time

import pytest

from app.constants import PAYMENT_PAID, PAYMENT_PROCESSING
from app.resources import payments as payments_resource


@pytest.fixture(autouse=True)
def instant_settle(monkeypatch):
    monkeypatch.setattr(payments_resource, "SIMULATED_SETTLE_SECONDS", 0)


def test_checkout_runs_in_simulation_without_daraja_keys(client, as_customer, created_order):
    response = client.post(
        f"/api/payments/{created_order['id']}/mpesa",
        headers=as_customer,
        json={"phone": "0712345678"},
    )

    assert response.status_code == 202
    body = response.get_json()
    assert body["simulated"] is True
    assert body["payment"]["status"] == PAYMENT_PROCESSING
    assert "simulated" in body["message"].lower()


def test_a_simulated_payment_settles_itself(client, as_customer, created_order):
    client.post(
        f"/api/payments/{created_order['id']}/mpesa",
        headers=as_customer,
        json={"phone": "0712345678"},
    )

    for _ in range(40):
        payment = client.get(
            f"/api/payments/{created_order['id']}", headers=as_customer
        ).get_json()["payment"]
        if payment["status"] == PAYMENT_PAID:
            break
        time.sleep(0.1)

    assert payment["status"] == PAYMENT_PAID
    assert payment["mpesa_receipt"].startswith("SIM")


def test_a_cancelled_order_cannot_be_paid(client, as_customer, created_order):
    client.patch(f"/api/orders/{created_order['id']}/cancel", headers=as_customer)

    response = client.post(
        f"/api/payments/{created_order['id']}/mpesa",
        headers=as_customer,
        json={"phone": "0712345678"},
    )
    assert response.status_code == 409


def test_a_bad_phone_number_is_refused(client, as_customer, created_order):
    response = client.post(
        f"/api/payments/{created_order['id']}/mpesa",
        headers=as_customer,
        json={"phone": "12"},
    )
    assert response.status_code == 422
