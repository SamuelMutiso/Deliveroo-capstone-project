import re
from threading import Thread

import requests
from flask import current_app

REQUEST_TIMEOUT = 15

HOSTS = {
    "sandbox": "https://api.sandbox.africastalking.com/version1/messaging",
    "production": "https://api.africastalking.com/version1/messaging",
}


def is_configured():
    config = current_app.config
    return bool(config.get("AT_USERNAME") and config.get("AT_API_KEY"))


def normalise_phone(raw):
    """Turn any local Kenyan format into the +2547XXXXXXXX form Africa's Talking expects."""
    digits = re.sub(r"\D", "", raw or "")
    if digits.startswith("0"):
        digits = "254" + digits[1:]
    elif digits.startswith("7") or digits.startswith("1"):
        digits = "254" + digits
    if not re.fullmatch(r"254[17]\d{8}", digits):
        return None
    return "+" + digits


def _endpoint():
    env = current_app.config.get("AT_ENV", "sandbox")
    return HOSTS.get(env, HOSTS["sandbox"])


def _deliver(app, url, payload, headers):
    with app.app_context():
        try:
            response = requests.post(url, data=payload, headers=headers, timeout=REQUEST_TIMEOUT)
            if response.status_code >= 300:
                app.logger.warning("SMS rejected (%s): %s", response.status_code, response.text[:200])
        except requests.RequestException as error:
            app.logger.warning("SMS delivery failed: %s", error)


def send_sms(phone, message):
    """Queue one SMS. Logs instead of sending when Africa's Talking is not configured."""
    app = current_app._get_current_object()
    number = normalise_phone(phone)

    if number is None:
        app.logger.info("SMS skipped, unusable number: %r", phone)
        return False

    if not is_configured():
        app.logger.info("SMS suppressed -> %s | %s", number, message[:90])
        return False

    payload = {
        "username": app.config["AT_USERNAME"],
        "to": number,
        "message": message[:640],
    }
    sender = app.config.get("AT_SENDER_ID")
    if sender:
        payload["from"] = sender

    headers = {
        "apiKey": app.config["AT_API_KEY"],
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    Thread(target=_deliver, args=(app, _endpoint(), payload, headers), daemon=True).start()
    return True
