import re
import secrets
import string

from flask import current_app

from ..constants import RIDER_EMAIL_DOMAIN, ROLE_COURIER
from ..extensions import db
from ..models import User

WORDS = ("swift", "amber", "delta", "kite", "nairobi", "matata", "zuri", "rapid")


def company_email_for(full_name):
    """Build a unique rider login address from the applicant's name."""
    slug = re.sub(r"[^a-z0-9]+", ".", full_name.strip().lower()).strip(".")
    slug = slug or "rider"
    domain = current_app.config.get("RIDER_EMAIL_DOMAIN", RIDER_EMAIL_DOMAIN)

    candidate = f"{slug}@{domain}"
    suffix = 2
    while User.query.filter_by(email=candidate).first() is not None:
        candidate = f"{slug}{suffix}@{domain}"
        suffix += 1
    return candidate


def temporary_password():
    word = secrets.choice(WORDS)
    digits = "".join(secrets.choice(string.digits) for _ in range(4))
    return f"{word.capitalize()}-{digits}"


def create_rider_account(application):
    """Turn an approved application into a rider login. Returns (user, plain_password)."""
    email = company_email_for(application.full_name)
    password = temporary_password()

    rider = User(
        name=application.full_name,
        email=email,
        contact_email=application.applicant.notification_email,
        phone=application.phone,
        role=ROLE_COURIER,
        email_verified=True,
        vehicle=application.vehicle_label,
        photo_url=application.profile_photo_url,
        is_available=False,
    )
    rider.password = password

    db.session.add(rider)
    db.session.flush()
    return rider, password
