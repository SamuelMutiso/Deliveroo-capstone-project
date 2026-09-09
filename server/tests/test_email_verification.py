from datetime import timedelta

import pytest

from app.extensions import db
from app.models import EmailVerification, User
from app.models.email_verification import MAX_ATTEMPTS
from app.services import notifications, verification
from app.utils.clock import utcnow

SIGNUP = {
    "name": "New Customer",
    "email": "new@test.dev",
    "password": "password123",
    "phone": "0712000111",
}


@pytest.fixture
def codes(monkeypatch):
    """Capture the code that would have been emailed."""
    sent = []

    def fake_email(subject, recipient, body, html=None):
        sent.append({"to": recipient, "subject": subject, "body": body})
        return True

    monkeypatch.setattr(notifications.mailer, "send_email", fake_email)
    return sent


def code_from(sent):
    digits = [word for word in sent[-1]["body"].replace(".", " ").split() if word.isdigit()]
    return next(word for word in digits if len(word) == 6)


def register(client, codes, **overrides):
    client.post("/api/auth/register", json={**SIGNUP, **overrides})
    return code_from(codes)


def test_registering_emails_a_six_digit_code(client, codes):
    response = client.post("/api/auth/register", json=SIGNUP)

    assert response.status_code == 201
    assert codes and codes[-1]["to"] == "new@test.dev"
    assert len(code_from(codes)) == 6


def test_the_code_is_never_stored_in_the_clear(client, codes):
    raw = register(client, codes)
    record = EmailVerification.query.one()

    assert record.code_hash != raw
    assert raw not in record.code_hash


def test_an_unverified_account_cannot_sign_in(client, codes):
    register(client, codes)

    response = client.post(
        "/api/auth/login", json={"email": SIGNUP["email"], "password": SIGNUP["password"]}
    )

    assert response.status_code == 403
    assert response.get_json()["verification_required"] is True


def test_the_right_code_verifies_and_returns_tokens(client, codes):
    raw = register(client, codes)

    response = client.post(
        "/api/auth/verify-email", json={"email": SIGNUP["email"], "code": raw}
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body["access_token"] and body["refresh_token"]
    assert User.query.filter_by(email=SIGNUP["email"]).one().email_verified is True


def test_signing_in_works_once_the_account_is_verified(client, codes):
    raw = register(client, codes)
    client.post("/api/auth/verify-email", json={"email": SIGNUP["email"], "code": raw})

    response = client.post(
        "/api/auth/login", json={"email": SIGNUP["email"], "password": SIGNUP["password"]}
    )

    assert response.status_code == 200
    assert response.get_json()["access_token"]


def test_a_wrong_code_is_refused(client, codes):
    register(client, codes)

    response = client.post(
        "/api/auth/verify-email", json={"email": SIGNUP["email"], "code": "000000"}
    )

    assert response.status_code == 400
    assert User.query.filter_by(email=SIGNUP["email"]).one().email_verified is False


def test_a_code_cannot_be_used_twice(client, codes):
    raw = register(client, codes)
    client.post("/api/auth/verify-email", json={"email": SIGNUP["email"], "code": raw})

    response = client.post(
        "/api/auth/verify-email", json={"email": SIGNUP["email"], "code": raw}
    )

    assert response.status_code == 409


def test_an_expired_code_is_refused(client, codes):
    raw = register(client, codes)
    record = EmailVerification.query.one()
    record.expires_at = utcnow() - timedelta(minutes=1)
    db.session.commit()

    response = client.post(
        "/api/auth/verify-email", json={"email": SIGNUP["email"], "code": raw}
    )

    assert response.status_code == 400


def test_guessing_is_capped(client, codes):
    raw = register(client, codes)
    for _ in range(MAX_ATTEMPTS):
        client.post("/api/auth/verify-email", json={"email": SIGNUP["email"], "code": "000000"})

    response = client.post(
        "/api/auth/verify-email", json={"email": SIGNUP["email"], "code": raw}
    )

    assert response.status_code == 429


def test_resending_retires_the_previous_code(client, codes):
    first = register(client, codes)
    user = User.query.filter_by(email=SIGNUP["email"]).one()
    EmailVerification.query.filter_by(user_id=user.id).update({"created_at": utcnow() - timedelta(minutes=5)})
    db.session.commit()

    client.post("/api/auth/resend-code", json={"email": SIGNUP["email"]})
    second = code_from(codes)

    assert second != first
    stale = client.post(
        "/api/auth/verify-email", json={"email": SIGNUP["email"], "code": first}
    )
    assert stale.status_code == 400
    fresh = client.post(
        "/api/auth/verify-email", json={"email": SIGNUP["email"], "code": second}
    )
    assert fresh.status_code == 200


def test_resending_too_soon_sends_nothing(client, codes):
    register(client, codes)
    before = len(codes)

    response = client.post("/api/auth/resend-code", json={"email": SIGNUP["email"]})

    assert response.status_code == 200
    assert response.get_json()["retry_after"] > 0
    assert len(codes) == before


def test_resending_never_reveals_whether_an_account_exists(client, codes):
    known = client.post("/api/auth/resend-code", json={"email": "nobody@test.dev"})

    assert known.status_code == 200
    assert "message" in known.get_json()
    assert codes == []


def test_a_seeded_account_is_already_verified(client, customer):
    response = client.post(
        "/api/auth/login", json={"email": customer.email, "password": "password123"}
    )

    assert response.status_code == 200


def test_the_verification_service_reports_the_resend_wait(client, codes):
    register(client, codes)
    user = User.query.filter_by(email=SIGNUP["email"]).one()

    assert 0 < verification.seconds_until_resend(user) <= verification.RESEND_COOLDOWN_SECONDS
