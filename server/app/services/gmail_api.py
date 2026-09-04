import base64
import threading
import time
from email.message import EmailMessage

import requests
from flask import current_app

TOKEN_URL = "https://oauth2.googleapis.com/token"
SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
REQUEST_TIMEOUT = 20
EXPIRY_MARGIN = 60

_lock = threading.Lock()
_cached_token = None
_expires_at = 0.0


def credentials():
    config = current_app.config
    return (
        config.get("GOOGLE_CLIENT_ID", ""),
        config.get("GOOGLE_CLIENT_SECRET", ""),
        config.get("GOOGLE_REFRESH_TOKEN", ""),
    )


def is_configured():
    return all(credentials())


def access_token():
    """Swap the long-lived refresh token for a short-lived access token, cached."""
    global _cached_token, _expires_at

    with _lock:
        if _cached_token and time.time() < _expires_at - EXPIRY_MARGIN:
            return _cached_token

        client_id, client_secret, refresh_token = credentials()
        response = requests.post(
            TOKEN_URL,
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        payload = response.json()

        _cached_token = payload["access_token"]
        _expires_at = time.time() + int(payload.get("expires_in", 3600))
        return _cached_token


def build_message(sender, recipient, subject, body, html=None):
    message = EmailMessage()
    message["To"] = recipient
    message["From"] = sender
    message["Subject"] = subject
    message.set_content(body)
    if html:
        message.add_alternative(html, subtype="html")
    return base64.urlsafe_b64encode(message.as_bytes()).decode("ascii")


def send(sender, recipient, subject, body, html=None):
    """Send one message through the Gmail API over HTTPS."""
    raw = build_message(sender, recipient, subject, body, html)
    response = requests.post(
        SEND_URL,
        json={"raw": raw},
        headers={"Authorization": f"Bearer {access_token()}"},
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response.json()
