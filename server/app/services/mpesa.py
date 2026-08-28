import os
import base64
from datetime import datetime

import requests


REQUEST_TIMEOUT = 20

DARAJA_BASE_URL = "https://sandbox.safaricom.co.ke"


def get_access_token():

    response = requests.get(
        f"{DARAJA_BASE_URL}/oauth/v1/generate",
        params={
            "grant_type": "client_credentials"
        },
        auth=(
            os.getenv("DARAJA_CONSUMER_KEY"),
            os.getenv("DARAJA_CONSUMER_SECRET"),
        ),
        timeout=REQUEST_TIMEOUT,
    )

    response.raise_for_status()

    data = response.json()

    return data["access_token"]


def generate_password():

    shortcode = os.getenv("DARAJA_SHORTCODE")
    passkey = os.getenv("DARAJA_PASSKEY")

    timestamp = datetime.now().strftime(
        "%Y%m%d%H%M%S"
    )

    raw_password = (
        shortcode
        + passkey
        + timestamp
    )

    password = base64.b64encode(
        raw_password.encode()
    ).decode()

    return timestamp, password


def stk_push(phone_number, amount):

    access_token = get_access_token()

    timestamp, password = generate_password()

    shortcode = os.getenv("DARAJA_SHORTCODE")

    callback_url = os.getenv(
        "DARAJA_CALLBACK_URL"
    )

    payload = {

        "BusinessShortCode": shortcode,

        "Password": password,

        "Timestamp": timestamp,

        "TransactionType":
            "CustomerPayBillOnline",

        "Amount": round(amount),

        "PartyA": phone_number,

        "PartyB": shortcode,

        "PhoneNumber": phone_number,

        "CallBackURL":
            f"{callback_url}/mpesa/callback",

        "AccountReference":
            "YourApp",

        "TransactionDesc":
            "Payment",
    }

    response = requests.post(

        f"{DARAJA_BASE_URL}"
        "/mpesa/stkpush/v1/processrequest",

        json=payload,

        headers={
            "Authorization":
                f"Bearer {access_token}"
        },

        timeout=REQUEST_TIMEOUT,
    )

    response.raise_for_status()

    return response.json()