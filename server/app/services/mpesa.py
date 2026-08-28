import os
import base64
import re
from datetime import datetime

import requests

from ..utils.errors import ApiError


REQUEST_TIMEOUT = 20

HOSTS = {
    "sandbox": "https://sandbox.safaricom.co.ke",
    "production": "https://api.safaricom.co.ke",
}


def _host():
    """
    Return the correct Safaricom API host depending
    on whether we're using sandbox or production.
    """
    environment = os.getenv("DARAJA_ENV", "sandbox")

    return HOSTS.get(
        environment,
        HOSTS["sandbox"]
    )


def _credentials():
    """
    Load Daraja credentials from environment variables.
    """

    consumer_key = os.getenv("DARAJA_CONSUMER_KEY")
    consumer_secret = os.getenv("DARAJA_CONSUMER_SECRET")
    passkey = os.getenv("DARAJA_PASSKEY")
    shortcode = os.getenv("DARAJA_SHORTCODE")
    callback_url = os.getenv("DARAJA_CALLBACK_URL")

    if not all([
        consumer_key,
        consumer_secret,
        passkey,
        shortcode,
        callback_url
    ]):
        raise ApiError(
            "M-Pesa is not configured correctly.",
            status_code=503
        )

    return (
        consumer_key,
        consumer_secret,
        passkey,
        shortcode,
        callback_url
    )


def normalise_phone(raw_phone):
    """
    Convert common Kenyan phone formats into
    the 254XXXXXXXXX format required by Daraja.

    Examples:

    0712345678
        -> 254712345678

    712345678
        -> 254712345678

    +254712345678
        -> 254712345678
    """

    digits = re.sub(
        r"\D",
        "",
        raw_phone or ""
    )

    if digits.startswith("0"):
        digits = "254" + digits[1:]

    elif digits.startswith("7") or digits.startswith("1"):
        digits = "254" + digits

    elif digits.startswith("+254"):
        digits = digits[1:]

    if not re.fullmatch(
        r"254[17]\d{8}",
        digits
    ):
        raise ApiError(
            "Enter a valid Safaricom number, "
            "for example 0712345678.",
            422
        )

    return digits


def get_access_token():
    """
    Ask Safaricom for an OAuth access token.
    """

    (
        consumer_key,
        consumer_secret,
        _passkey,
        _shortcode,
        _callback_url
    ) = _credentials()

    response = requests.get(
        f"{_host()}/oauth/v1/generate",
        params={
            "grant_type": "client_credentials"
        },
        auth=(
            consumer_key,
            consumer_secret
        ),
        timeout=REQUEST_TIMEOUT
    )

    if response.status_code != 200:
        raise ApiError(
            "Could not authenticate with M-Pesa.",
            502
        )

    token = response.json().get(
        "access_token"
    )

    if not token:
        raise ApiError(
            "M-Pesa did not return an access token.",
            502
        )

    return token


def generate_password():
    """
    Generate the Daraja STK Push password.

    Password =
        Base64(
            BusinessShortCode
            + Passkey
            + Timestamp
        )
    """

    (
        _consumer_key,
        _consumer_secret,
        passkey,
        shortcode,
        _callback_url
    ) = _credentials()

    timestamp = datetime.now().strftime(
        "%Y%m%d%H%M%S"
    )

    raw_password = (
        f"{shortcode}"
        f"{passkey}"
        f"{timestamp}"
    )

    password = base64.b64encode(
        raw_password.encode()
    ).decode()

    return timestamp, password


def stk_push(
    phone_number,
    amount,
    reference="YourApp",
    description="Payment"
):
    """
    Initiate an STK Push through Daraja.
    """

    phone_number = normalise_phone(
        phone_number
    )

    amount = int(round(float(amount)))

    if amount <= 0:
        raise ApiError(
            "Payment amount must be greater than zero.",
            422
        )

    access_token = get_access_token()

    timestamp, password = generate_password()

    (
        _consumer_key,
        _consumer_secret,
        _passkey,
        shortcode,
        callback_url
    ) = _credentials()

    payload = {
        "BusinessShortCode": shortcode,

        "Password": password,

        "Timestamp": timestamp,

        "TransactionType":
            "CustomerPayBillOnline",

        "Amount": amount,

        "PartyA": phone_number,

        "PartyB": shortcode,

        "PhoneNumber": phone_number,

        "CallBackURL":
            f"{callback_url}/mpesa/callback",

        "AccountReference":
            str(reference)[:12],

        "TransactionDesc":
            str(description)[:60],
    }

    response = requests.post(
        f"{_host()}/mpesa/stkpush/v1/processrequest",

        json=payload,

        headers={
            "Authorization":
                f"Bearer {access_token}"
        },

        timeout=REQUEST_TIMEOUT
    )

    try:
        body = response.json()
    except ValueError:
        raise ApiError(
            "M-Pesa returned an invalid response.",
            502
        )

    if (
        response.status_code != 200
        or body.get("ResponseCode") not in ("0", 0)
    ):
        message = (
            body.get("errorMessage")
            or body.get("ResponseDescription")
            or "M-Pesa rejected the payment request."
        )

        raise ApiError(
            message,
            502
        )

    return {
        "checkout_request_id":
            body.get("CheckoutRequestID"),

        "merchant_request_id":
            body.get("MerchantRequestID"),

        "customer_message":
            body.get("CustomerMessage"),

        "response_code":
            body.get("ResponseCode"),

        "response_description":
            body.get("ResponseDescription"),
    }


def parse_callback(payload):
    """
    Extract useful information from
    Safaricom's STK callback payload.
    """

    stk_callback = (
        (payload or {})
        .get("Body", {})
        .get("stkCallback", {})
    )

    items = (
        stk_callback
        .get("CallbackMetadata", {})
        .get("Item", [])
    )

    metadata = {
        item.get("Name"): item.get("Value")
        for item in items
        if item.get("Name")
    }

    return {
        "checkout_request_id":
            stk_callback.get(
                "CheckoutRequestID"
            ),

        "merchant_request_id":
            stk_callback.get(
                "MerchantRequestID"
            ),

        "result_code":
            stk_callback.get(
                "ResultCode"
            ),

        "result_description":
            stk_callback.get(
                "ResultDesc"
            ),

        "receipt":
            metadata.get(
                "MpesaReceiptNumber"
            ),

        "amount":
            metadata.get(
                "Amount"
            ),

        "phone":
            metadata.get(
                "PhoneNumber"
            ),

        "transaction_date":
            metadata.get(
                "TransactionDate"
            ),
    }