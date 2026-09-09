import pytest

TINY_PNG = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8"
    "z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


@pytest.fixture
def rider(client, as_admin, as_customer):
    """Approve an application and return the brand new rider's credentials and token."""
    application = client.post(
        "/api/courier-applications",
        headers=as_customer,
        json={
            "full_name": "Kevin Omondi",
            "phone": "0722555111",
            "licence_number": "dl-99182",
            "vehicle_type": "motorbike",
            "vehicle_ownership": "company",
            "profile_photo_url": TINY_PNG,
        },
    ).get_json()["application"]

    credentials = client.patch(
        f"/api/admin/courier-applications/{application['id']}/approve",
        headers=as_admin,
        json={},
    ).get_json()["credentials"]

    signed_in = client.post(
        "/api/auth/login",
        json={"email": credentials["email"], "password": credentials["password"]},
    ).get_json()

    return {
        "credentials": credentials,
        "headers": {"Authorization": f"Bearer {signed_in['access_token']}"},
        "user": signed_in["user"],
    }


def test_a_new_rider_is_flagged_to_change_their_password(rider):
    assert rider["user"]["must_change_password"] is True


def test_a_new_rider_can_still_sign_in(rider):
    assert rider["headers"]["Authorization"].startswith("Bearer ")


def test_a_temporary_password_opens_nothing_else(client, rider):
    response = client.get("/api/courier/orders", headers=rider["headers"])

    assert response.status_code == 403
    assert response.get_json()["password_change_required"] is True


def test_the_block_is_not_only_in_the_browser(client, rider):
    """Every protected route refuses, not just the ones the app happens to link to."""
    for path in ("/api/orders", "/api/notifications", "/api/courier/summary"):
        response = client.get(path, headers=rider["headers"])
        assert response.status_code == 403, f"{path} let a temporary password through"


def test_a_rider_can_still_read_their_own_account(client, rider):
    response = client.get("/api/auth/me", headers=rider["headers"])

    assert response.status_code == 200


def test_changing_the_password_lifts_the_block(client, rider):
    changed = client.post(
        "/api/auth/change-password",
        headers=rider["headers"],
        json={
            "current_password": rider["credentials"]["password"],
            "new_password": "ridersOwnPassword1",
        },
    )

    assert changed.status_code == 200
    assert changed.get_json()["user"]["must_change_password"] is False

    response = client.get("/api/courier/orders", headers=rider["headers"])
    assert response.status_code == 200


def test_the_old_temporary_password_stops_working(client, rider):
    client.post(
        "/api/auth/change-password",
        headers=rider["headers"],
        json={
            "current_password": rider["credentials"]["password"],
            "new_password": "ridersOwnPassword1",
        },
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": rider["credentials"]["email"],
            "password": rider["credentials"]["password"],
        },
    )

    assert response.status_code == 401


def test_an_ordinary_customer_is_not_blocked(client, as_customer):
    response = client.get("/api/orders", headers=as_customer)

    assert response.status_code == 200
