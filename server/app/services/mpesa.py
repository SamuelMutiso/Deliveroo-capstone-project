import base64
import uuid
import re
from datetime import datetime

import requests
from flask import current_app

from ..utils.errors import ApiError

REQUEST_TIMEOUT = 20

HOSTS = {
    "sandbox": "https://sandbox.safaricom.co.ke",
    "production": "https://api.safaricom.co.ke",
}


def _host():
    env = current_app.config.get("MPESA_ENV", "sandbox")
    return HOSTS.get(env, HOSTS["sandbox"])


def _raw_credentials():
    return (
        current_app.config.get("MPESA_CONSUMER_KEY", ""),
        current_app.config.get("MPESA_CONSUMER_SECRET", ""),
        current_app.config.get("MPESA_PASSKEY", ""),
        str(current_app.config.get("MPESA_SHORTCODE", "")),
        current_app.config.get("MPESA_CALLBACK_URL", ""),
    )


def is_simulated():
    """True when no Daraja credentials are set, so checkout runs against a stand-in."""
    return not all(_raw_credentials())


def _credentials():
    values = _raw_credentials()
    if not all(values):
        raise ApiError(
            "M-Pesa is not configured. Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, "
            "MPESA_PASSKEY, MPESA_SHORTCODE and MPESA_CALLBACK_URL.",
            status_code=503,
        )
    return values


def normalise_phone(raw):
    digits = re.sub(r"\D", "", raw or "")
    if digits.startswith("0"):
        digits = "254" + digits[1:]
    elif digits.startswith("7") or digits.startswith("1"):
        digits = "254" + digits
    elif digits.startswith("+254"):
        digits = digits[1:]
    if not re.fullmatch(r"254[17]\d{8}", digits):
        raise ApiError("Enter a valid Safaricom number, for example 0712345678", 422)
    return digits


def access_token():
    key, secret, _passkey, _shortcode, _callback = _credentials()
    response = requests.get(
        f"{_host()}/oauth/v1/generate?grant_type=client_credentials",
        auth=(key, secret),
        timeout=REQUEST_TIMEOUT,
    )
    if response.status_code != 200:
        raise ApiError("Could not authenticate with M-Pesa", 502)
    token = response.json().get("access_token")
    if not token:
        raise ApiError("M-Pesa did not return an access token", 502)
    return token


def simulated_push(reference):
    """Stand-in for the Daraja STK push, used when no credentials are configured."""
    stamp = uuid.uuid4().hex[:10].upper()
    return {
        "checkout_request_id": f"ws_CO_SIM_{stamp}",
        "merchant_request_id": f"SIM-{stamp}",
        "customer_message": (
            "Simulated M-Pesa prompt sent. This demo settles the payment automatically "
            "in a few seconds."
        ),
        "simulated": True,
    }


def simulated_receipt():
    return "SIM" + uuid.uuid4().hex[:7].upper()


def stk_push(phone, amount, reference, description):
    if is_simulated():
        return simulated_push(reference)

    _key, _secret, passkey, shortcode, callback = _credentials()
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password = base64.b64encode(f"{shortcode}{passkey}{timestamp}".encode()).decode()

    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(round(amount)),
        "PartyA": phone,
        "PartyB": shortcode,
        "PhoneNumber": phone,
        "CallBackURL": callback,
        "AccountReference": reference[:12],
        "TransactionDesc": description[:60],
    }

    response = requests.post(
        f"{_host()}/mpesa/stkpush/v1/processrequest",
        json=payload,
        headers={"Authorization": f"Bearer {access_token()}"},
        timeout=REQUEST_TIMEOUT,
    )
    body = response.json()

    if response.status_code != 200 or body.get("ResponseCode") not in ("0", 0):
        message = body.get("errorMessage") or body.get("ResponseDescription") or "M-Pesa rejected the request"
        raise ApiError(message, 502)

    return {
        "checkout_request_id": body.get("CheckoutRequestID"),
        "merchant_request_id": body.get("MerchantRequestID"),
        "customer_message": body.get("CustomerMessage"),
    }


def parse_callback(payload):
    stk = (payload or {}).get("Body", {}).get("stkCallback", {})
    items = stk.get("CallbackMetadata", {}).get("Item", [])
    metadata = {item.get("Name"): item.get("Value") for item in items if item.get("Name")}
    return {
        "checkout_request_id": stk.get("CheckoutRequestID"),
        "merchant_request_id": stk.get("MerchantRequestID"),
        "result_code": stk.get("ResultCode"),
        "result_description": stk.get("ResultDesc"),
        "receipt": metadata.get("MpesaReceiptNumber"),
        "amount": metadata.get("Amount"),
        "phone": metadata.get("PhoneNumber"),
    }
