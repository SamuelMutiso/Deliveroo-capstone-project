def test_register_creates_customer_and_withholds_tokens(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "New Customer",
            "email": "new@test.dev",
            "password": "password123",
            "phone": "0712000111",
        },
    )
    body = response.get_json()

    assert response.status_code == 201
    assert body["user"]["role"] == "customer"
    assert body["verification_required"] is True
    assert "access_token" not in body and "refresh_token" not in body
    assert "password" not in body["user"]


def test_register_rejects_duplicate_email(client, customer):
    response = client.post(
        "/api/auth/register",
        json={"name": "Copy Cat", "email": customer.email, "password": "password123"},
    )
    assert response.status_code == 409


def test_register_rejects_short_password(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "Weak", "email": "weak@test.dev", "password": "123"},
    )
    assert response.status_code == 422
    assert "password" in response.get_json()["errors"]


def test_register_cannot_self_assign_admin(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Sneaky",
            "email": "sneaky@test.dev",
            "password": "password123",
            "role": "admin",
        },
    )
    assert response.status_code == 403


def test_login_rejects_wrong_password(client, customer):
    response = client.post(
        "/api/auth/login", json={"email": customer.email, "password": "wrong-password"}
    )
    assert response.status_code == 401


def test_login_rejects_deactivated_account(client, db, customer):
    customer.is_active = False
    db.session.commit()

    response = client.post(
        "/api/auth/login", json={"email": customer.email, "password": "password123"}
    )
    assert response.status_code == 403


def test_password_is_hashed_not_stored_in_plain_text(customer):
    assert customer.password_hash != "password123"
    assert customer.verify_password("password123")
    assert not customer.verify_password("password124")


def test_me_requires_a_token(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_returns_the_signed_in_user(client, as_customer, customer):
    response = client.get("/api/auth/me", headers=as_customer)
    assert response.status_code == 200
    assert response.get_json()["user"]["email"] == customer.email


def test_logout_revokes_the_token(client, as_customer):
    assert client.post("/api/auth/logout", headers=as_customer).status_code == 200
    assert client.get("/api/auth/me", headers=as_customer).status_code == 401
