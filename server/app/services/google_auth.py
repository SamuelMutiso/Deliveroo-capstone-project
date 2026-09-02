import requests
from flask import current_app

from ..utils.errors import ApiError

TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
ISSUERS = ("accounts.google.com", "https://accounts.google.com")
REQUEST_TIMEOUT = 10


def client_id():
    return current_app.config.get("GOOGLE_OAUTH_CLIENT_ID", "")


def is_configured():
    return bool(client_id())


def verify(credential):
    """Check a Google ID token with Google and return the account behind it."""
    expected = client_id()
    if not expected:
        raise ApiError("Google sign-in is not configured on this server", 503)

    try:
        response = requests.get(
            TOKENINFO_URL, params={"id_token": credential}, timeout=REQUEST_TIMEOUT
        )
    except requests.RequestException:
        raise ApiError("Could not reach Google to check that sign-in", 503)

    if response.status_code != 200:
        raise ApiError("That Google sign-in could not be verified", 401)

    payload = response.json()

    if payload.get("aud") != expected:
        raise ApiError("That Google sign-in was issued for a different application", 401)
    if payload.get("iss") not in ISSUERS:
        raise ApiError("That Google sign-in did not come from Google", 401)
    if str(payload.get("email_verified", "")).lower() not in ("true", "1"):
        raise ApiError("That Google account has no verified email address", 401)

    email = (payload.get("email") or "").strip().lower()
    if not email:
        raise ApiError("That Google account did not share an email address", 401)

    return {
        "email": email,
        "name": (payload.get("name") or email.split("@")[0]).strip(),
        "picture": payload.get("picture") or None,
    }
