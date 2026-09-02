import pytest

from app.services import google_auth, notifications

TINY_PNG = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8"
    "z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)

CLIENT_ID = "deliveroo-test-client.apps.googleusercontent.com"


@pytest.fixture
def outbox(monkeypatch):
    """Capture every notification instead of sending it."""
    sent = {"email": [], "sms": []}

    def fake_email(subject, recipient, body, html=None):
        if recipient:
            sent["email"].append({"to": recipient, "subject": subject, "body": body})
        return True

    def fake_sms(phone, message):
        if phone:
            sent["sms"].append({"to": phone, "message": message})
        return True

    monkeypatch.setattr(notifications.mailer, "send_email", fake_email)
    monkeypatch.setattr(notifications.sms, "send_sms", fake_sms)
    return sent


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


def test_a_new_rider_application_emails_the_admin(
    client, as_customer, admin, application_payload, outbox
):
    response = client.post(
        "/api/courier-applications", headers=as_customer, json=application_payload
    )

    assert response.status_code == 201
    to_admin = [m for m in outbox["email"] if m["to"] == admin.email]
    assert to_admin, "the admin was not emailed about the application"
    assert "Kevin Omondi" in to_admin[0]["subject"]


def test_a_new_rider_application_confirms_to_the_applicant(
    client, as_customer, customer, admin, application_payload, outbox
):
    client.post("/api/courier-applications", headers=as_customer, json=application_payload)

    to_applicant = [m for m in outbox["email"] if m["to"] == customer.email]
    assert to_applicant, "the applicant was not sent a confirmation"


def test_a_new_rider_application_reaches_the_admin_notification_bell(
    client, as_admin, as_customer, admin, application_payload, outbox
):
    client.post("/api/courier-applications", headers=as_customer, json=application_payload)

    feed = client.get("/api/notifications", headers=as_admin).get_json()
    events = [item["event"] for item in feed["items"]]
    assert notifications.RIDER_APPLIED in events


class FakeResponse:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


def _google_says(monkeypatch, payload, status=200):
    monkeypatch.setattr(
        google_auth.requests, "get", lambda *args, **kwargs: FakeResponse(status, payload)
    )


def _token(**overrides):
    payload = {
        "aud": CLIENT_ID,
        "iss": "accounts.google.com",
        "email_verified": "true",
        "email": "new.rider@gmail.com",
        "name": "New Rider",
    }
    payload.update(overrides)
    return payload


def test_google_sign_in_is_refused_when_the_server_has_no_client_id(client):
    response = client.post("/api/auth/google", json={"credential": "anything"})

    assert response.status_code == 503


def test_google_sign_in_creates_a_customer_account(client, app, monkeypatch):
    app.config["GOOGLE_OAUTH_CLIENT_ID"] = CLIENT_ID
    _google_says(monkeypatch, _token(email="New.Rider@gmail.com"))

    response = client.post("/api/auth/google", json={"credential": "valid"})

    assert response.status_code == 201
    body = response.get_json()
    assert body["created"] is True
    assert body["user"]["email"] == "new.rider@gmail.com"
    assert body["user"]["role"] == "customer"
    assert body["access_token"]


def test_google_sign_in_returns_the_existing_account(client, app, customer, monkeypatch):
    app.config["GOOGLE_OAUTH_CLIENT_ID"] = CLIENT_ID
    _google_says(monkeypatch, _token(email=customer.email, name=customer.name))

    response = client.post("/api/auth/google", json={"credential": "valid"})

    assert response.status_code == 200
    body = response.get_json()
    assert body["created"] is False
    assert body["user"]["id"] == customer.id


def test_a_google_token_issued_for_another_app_is_refused(client, app, monkeypatch):
    app.config["GOOGLE_OAUTH_CLIENT_ID"] = CLIENT_ID
    _google_says(monkeypatch, _token(aud="someone-elses-client-id"))

    response = client.post("/api/auth/google", json={"credential": "valid"})

    assert response.status_code == 401


def test_an_unverified_google_email_is_refused(client, app, monkeypatch):
    app.config["GOOGLE_OAUTH_CLIENT_ID"] = CLIENT_ID
    _google_says(monkeypatch, _token(email_verified="false"))

    response = client.post("/api/auth/google", json={"credential": "valid"})

    assert response.status_code == 401


def test_a_rejected_google_token_is_refused(client, app, monkeypatch):
    app.config["GOOGLE_OAUTH_CLIENT_ID"] = CLIENT_ID
    _google_says(monkeypatch, {"error": "invalid_token"}, status=400)

    response = client.post("/api/auth/google", json={"credential": "expired"})

    assert response.status_code == 401


def test_google_sign_in_needs_a_credential(client, app):
    app.config["GOOGLE_OAUTH_CLIENT_ID"] = CLIENT_ID

    response = client.post("/api/auth/google", json={})

    assert response.status_code == 400
