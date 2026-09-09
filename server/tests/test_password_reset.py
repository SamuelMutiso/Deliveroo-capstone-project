from app.extensions import db
from app.models import PasswordResetToken, User


def _issue(client, email):
    return client.post("/api/auth/forgot-password", json={"email": email})


def test_forgot_password_creates_a_single_use_token(client, app, customer):
    email = customer.email

    response = _issue(client, email)
    assert response.status_code == 200

    tokens = PasswordResetToken.query.all()
    assert len(tokens) == 1
    assert tokens[0].used_at is None
    assert tokens[0].is_valid


def test_forgot_password_does_not_reveal_unknown_accounts(client):
    response = _issue(client, "nobody@example.com")
    assert response.status_code == 200
    assert "If that email is registered" in response.get_json()["message"]
    assert PasswordResetToken.query.count() == 0


def test_forgot_password_is_case_insensitive(client, customer):
    response = _issue(client, customer.email.upper())
    assert response.status_code == 200
    assert PasswordResetToken.query.count() == 1


def test_reset_password_changes_the_password_and_burns_the_token(client, customer):
    email = customer.email
    user = User.query.filter_by(email=email).first()

    record, raw = PasswordResetToken.issue(user)
    db.session.add(record)
    db.session.commit()

    response = client.post(
        "/api/auth/reset-password", json={"token": raw, "new_password": "brand-new-pass"}
    )
    assert response.status_code == 200

    signin = client.post(
        "/api/auth/login", json={"email": email, "password": "brand-new-pass"}
    )
    assert signin.status_code == 200

    replay = client.post(
        "/api/auth/reset-password", json={"token": raw, "new_password": "another-pass-1"}
    )
    assert replay.status_code == 400


def test_reset_password_rejects_a_bad_token(client):
    response = client.post(
        "/api/auth/reset-password",
        json={"token": "not-a-real-token", "new_password": "whatever12"},
    )
    assert response.status_code == 400


def test_reset_password_rejects_a_short_password(client, customer):
    user = User.query.filter_by(email=customer.email).first()
    record, raw = PasswordResetToken.issue(user)
    db.session.add(record)
    db.session.commit()

    response = client.post(
        "/api/auth/reset-password", json={"token": raw, "new_password": "short"}
    )
    assert response.status_code == 422


def test_issuing_a_new_token_invalidates_the_previous_one(client, customer):
    email = customer.email
    _issue(client, email)
    _issue(client, email)

    tokens = PasswordResetToken.query.order_by(PasswordResetToken.id).all()
    assert len(tokens) == 2
    assert tokens[0].used_at is not None
    assert tokens[1].used_at is None
