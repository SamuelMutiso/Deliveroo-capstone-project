import pytest

TINY_PNG = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8"
    "z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


@pytest.fixture
def application_payload():
    return {
        "full_name": "Kevin Omondi",
        "phone": "0722555111",
        "licence_number": "dl-99182",
        "vehicle_type": "motorbike",
        "vehicle_ownership": "own",
        "vehicle_registration": "kmfa 883x",
        "vehicle_photo_url": TINY_PNG,
        "profile_photo_url": TINY_PNG,
    }


@pytest.fixture
def submitted(client, as_customer, application_payload):
    response = client.post("/api/courier-applications", headers=as_customer, json=application_payload)
    assert response.status_code == 201
    return response.get_json()["application"]


def test_a_customer_can_apply_to_ride(submitted):
    assert submitted["status"] == "pending"
    assert submitted["licence_number"] == "DL-99182"
    assert submitted["vehicle_registration"] == "KMFA 883X"
    assert submitted["vehicle_label"] == "Motorbike KMFA 883X"


def test_own_vehicle_needs_a_plate_and_a_photo(client, as_customer, application_payload):
    application_payload.pop("vehicle_registration")
    application_payload.pop("vehicle_photo_url")

    response = client.post("/api/courier-applications", headers=as_customer, json=application_payload)
    assert response.status_code == 422


def test_a_company_vehicle_needs_neither(client, as_customer, application_payload):
    application_payload["vehicle_ownership"] = "company"
    application_payload.pop("vehicle_registration")
    application_payload.pop("vehicle_photo_url")

    response = client.post("/api/courier-applications", headers=as_customer, json=application_payload)
    assert response.status_code == 201
    assert response.get_json()["application"]["vehicle_label"] == "Company motorbike"


def test_you_cannot_apply_twice(client, as_customer, application_payload, submitted):
    response = client.post("/api/courier-applications", headers=as_customer, json=application_payload)
    assert response.status_code == 409


def test_a_courier_cannot_apply(client, as_courier, application_payload):
    response = client.post("/api/courier-applications", headers=as_courier, json=application_payload)
    assert response.status_code == 403


def test_an_applicant_sees_their_own_application(client, as_customer, submitted):
    response = client.get("/api/courier-applications/mine", headers=as_customer)
    assert response.status_code == 200
    assert response.get_json()["application"]["id"] == submitted["id"]


def test_admin_sees_pending_applications(client, as_admin, submitted):
    response = client.get("/api/admin/courier-applications", headers=as_admin)
    assert response.status_code == 200
    body = response.get_json()
    assert body["pending_count"] == 1
    assert body["applications"][0]["full_name"] == "Kevin Omondi"


def test_a_customer_cannot_see_the_admin_queue(client, as_customer, submitted):
    response = client.get("/api/admin/courier-applications", headers=as_customer)
    assert response.status_code == 403


def test_approval_issues_a_company_login(client, as_admin, submitted):
    response = client.patch(
        f"/api/admin/courier-applications/{submitted['id']}/approve",
        headers=as_admin,
        json={"note": "Documents check out"},
    )
    assert response.status_code == 200

    body = response.get_json()
    credentials = body["credentials"]

    assert credentials["email"].endswith("@riders.deliveroo.co.ke")
    assert credentials["email"].startswith("kevin.omondi@")
    assert len(credentials["password"]) >= 8
    assert body["application"]["status"] == "approved"
    assert body["application"]["courier"]["role"] == "courier"


def test_the_new_rider_can_sign_in_and_the_personal_account_still_works(
    client, as_admin, submitted, customer
):
    approval = client.patch(
        f"/api/admin/courier-applications/{submitted['id']}/approve",
        headers=as_admin,
        json={},
    ).get_json()["credentials"]

    rider_login = client.post(
        "/api/auth/login",
        json={"email": approval["email"], "password": approval["password"]},
    )
    assert rider_login.status_code == 200
    assert rider_login.get_json()["user"]["role"] == "courier"

    customer_login = client.post(
        "/api/auth/login", json={"email": customer.email, "password": "password123"}
    )
    assert customer_login.status_code == 200
    assert customer_login.get_json()["user"]["role"] == "customer"


def test_the_rider_account_keeps_the_personal_email_for_notifications(
    client, as_admin, submitted, customer, app
):
    approval = client.patch(
        f"/api/admin/courier-applications/{submitted['id']}/approve", headers=as_admin, json={}
    ).get_json()["credentials"]

    from app.models import User

    with app.app_context():
        rider = User.query.filter_by(email=approval["email"]).first()
        assert rider.contact_email == customer.email
        assert rider.notification_email == customer.email


def test_an_application_cannot_be_approved_twice(client, as_admin, submitted):
    first = client.patch(
        f"/api/admin/courier-applications/{submitted['id']}/approve", headers=as_admin, json={}
    )
    assert first.status_code == 200

    second = client.patch(
        f"/api/admin/courier-applications/{submitted['id']}/approve", headers=as_admin, json={}
    )
    assert second.status_code == 409


def test_rejection_records_the_reason(client, as_admin, submitted):
    response = client.patch(
        f"/api/admin/courier-applications/{submitted['id']}/reject",
        headers=as_admin,
        json={"note": "Licence has expired"},
    )
    assert response.status_code == 200
    assert response.get_json()["application"]["status"] == "rejected"
    assert response.get_json()["application"]["review_note"] == "Licence has expired"


def test_two_riders_with_the_same_name_get_different_logins(
    client, as_admin, as_other_customer, application_payload, submitted
):
    second = client.post(
        "/api/courier-applications", headers=as_other_customer, json=application_payload
    ).get_json()["application"]

    first_email = client.patch(
        f"/api/admin/courier-applications/{submitted['id']}/approve", headers=as_admin, json={}
    ).get_json()["credentials"]["email"]

    second_email = client.patch(
        f"/api/admin/courier-applications/{second['id']}/approve", headers=as_admin, json={}
    ).get_json()["credentials"]["email"]

    assert first_email != second_email


def test_a_rider_toggles_their_own_availability(client, as_courier):
    on = client.patch("/api/courier/availability", headers=as_courier, json={"is_available": True})
    assert on.status_code == 200
    assert on.get_json()["is_available"] is True

    off = client.patch("/api/courier/availability", headers=as_courier, json={"is_available": False})
    assert off.get_json()["is_available"] is False


def test_a_customer_cannot_set_availability(client, as_customer):
    response = client.patch(
        "/api/courier/availability", headers=as_customer, json={"is_available": True}
    )
    assert response.status_code == 403


def test_the_admin_picker_shows_who_is_on_duty(client, as_admin, as_courier):
    client.patch("/api/courier/availability", headers=as_courier, json={"is_available": True})

    response = client.get("/api/admin/couriers", headers=as_admin)
    assert response.status_code == 200

    couriers = response.get_json()["couriers"]
    assert couriers[0]["availability"] == "available"
    assert couriers[0]["is_available"] is True

    client.patch("/api/courier/availability", headers=as_courier, json={"is_available": False})
    offline = client.get("/api/admin/couriers", headers=as_admin).get_json()["couriers"]
    assert offline[0]["availability"] == "offline"


def test_a_user_changes_their_password(client, as_customer, customer):
    response = client.post(
        "/api/auth/change-password",
        headers=as_customer,
        json={"current_password": "password123", "new_password": "brand-new-secret"},
    )
    assert response.status_code == 200

    assert client.post(
        "/api/auth/login", json={"email": customer.email, "password": "brand-new-secret"}
    ).status_code == 200
    assert client.post(
        "/api/auth/login", json={"email": customer.email, "password": "password123"}
    ).status_code == 401


def test_the_wrong_current_password_is_refused(client, as_customer):
    response = client.post(
        "/api/auth/change-password",
        headers=as_customer,
        json={"current_password": "not-it", "new_password": "brand-new-secret"},
    )
    assert response.status_code == 400


def test_a_short_new_password_is_refused(client, as_customer):
    response = client.post(
        "/api/auth/change-password",
        headers=as_customer,
        json={"current_password": "password123", "new_password": "short"},
    )
    assert response.status_code == 422
