import hmac
from hashlib import sha256

from flask import current_app

DIGEST_LENGTH = 12


def _secret():
    return (current_app.config.get("SECRET_KEY") or "").encode("utf-8")


def _payload(order):
    stamp = order.delivered_at.isoformat() if order.delivered_at else ""
    return f"{order.id}:{order.tracking_code}:{stamp}".encode("utf-8")


def digest_for(order):
    """A short keyed digest that proves this receipt came from us."""
    return hmac.new(_secret(), _payload(order), sha256).hexdigest()[:DIGEST_LENGTH]


def reference_for(order):
    """The printed document reference, e.g. DLV-BS6EQE-4f9a2c71e08b."""
    return f"{order.tracking_code}-{digest_for(order)}"


def split_reference(reference):
    raw = (reference or "").strip().upper()
    if "-" not in raw:
        return None, None
    tracking_code, _, digest = raw.rpartition("-")
    return tracking_code or None, digest.lower() or None


def matches(order, digest):
    if not order or not digest:
        return False
    return hmac.compare_digest(digest_for(order), digest.lower())
