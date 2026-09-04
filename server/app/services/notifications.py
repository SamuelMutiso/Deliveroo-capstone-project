import re

from flask import current_app

from ..constants import METHOD_CASH, ROLE_ADMIN
from ..extensions import db
from ..utils.clock import utcnow
from . import mailer, receipts, sms

ORDER_CREATED = "order_created"
COURIER_ASSIGNED = "courier_assigned"
PICKED_UP = "picked_up"
IN_TRANSIT = "in_transit"
DELIVERED = "delivered"
CANCELLED = "cancelled"
PAYMENT_RECEIVED = "payment_received"
CASH_DECLARED = "cash_declared"
RIDER_APPLIED = "rider_applied"
EMAIL_VERIFICATION = "email_verification"

STATUS_EVENTS = {
    "picked_up": PICKED_UP,
    "in_transit": IN_TRANSIT,
    "delivered": DELIVERED,
    "cancelled": CANCELLED,
}


def _money(value):
    return f"KES {value:,.0f}"


def _party(name, email, phone, sms_enabled=True):
    return {"name": name or "there", "email": email, "phone": phone, "sms": sms_enabled}


def _admins():
    from ..models import User

    return [
        _party(admin.name, admin.notification_email, admin.phone, sms_enabled=False)
        for admin in User.query.filter_by(role=ROLE_ADMIN, is_active=True).all()
    ]


def _audience(order):
    people = {}

    if order.customer:
        people["customer"] = _party(order.customer.name, order.customer.notification_email, order.customer.phone)

    people["recipient"] = _party(order.recipient_name, order.recipient_email, order.recipient_phone)

    if order.courier:
        people["courier"] = _party(order.courier.name, order.courier.notification_email, order.courier.phone)

    people["admins"] = _admins()
    return people


def _copy(order, event):
    """Return (subject, {audience_key: (title, [paragraphs], sms_text)}) for one event."""
    code = order.tracking_code
    origin = order.pickup_address
    target = order.destination_address
    courier_name = order.courier.name if order.courier else "A rider"
    customer_name = order.customer.name if order.customer else "A customer"
    total = _money(order.price_kes)

    if event == ORDER_CREATED:
        return (
            f"Order confirmed · {code}",
            {
                "customer": (
                    "Order confirmed",
                    [
                        f"We have your delivery request. Parcel <strong>{code}</strong> will move from "
                        f"{origin} to {target}.",
                        f"Total payable is {total}. We will let you know the moment a rider is assigned.",
                    ],
                    f"Deliveroo: order {code} confirmed, {origin} to {target}. Total {total}. "
                    f"We will text you when a rider is assigned.",
                ),
                "recipient": (
                    "A parcel is being sent to you",
                    [
                        f"{customer_name} has arranged a delivery to you at {target}.",
                        f"Your tracking reference is <strong>{code}</strong>. We will let you know "
                        f"when a rider collects it.",
                    ],
                    f"Deliveroo: {customer_name} is sending you a parcel to {target}. "
                    f"Tracking {code}.",
                ),
                "admins": (
                    "New order awaiting a rider",
                    [
                        f"{customer_name} placed order <strong>{code}</strong> ({origin} → {target}, "
                        f"{order.distance_km} km, {total}).",
                    ],
                    None,
                ),
            },
        )

    if event == COURIER_ASSIGNED:
        return (
            f"A rider is on the way · {code}",
            {
                "customer": (
                    "A rider is on the way",
                    [
                        f"{courier_name} has been assigned to parcel <strong>{code}</strong> and will "
                        f"collect it from {origin}.",
                    ],
                    f"Deliveroo: {courier_name} is assigned to order {code} and will collect from {origin}.",
                ),
                "recipient": (
                    "A rider is collecting your parcel",
                    [
                        f"{courier_name} will collect parcel <strong>{code}</strong> from {origin} "
                        f"and bring it to you at {target}.",
                    ],
                    f"Deliveroo: {courier_name} is collecting parcel {code} and bringing it to {target}.",
                ),
                "courier": (
                    "New assignment",
                    [
                        f"Collect parcel <strong>{code}</strong> from {origin} and deliver it to "
                        f"{target} ({order.distance_km} km).",
                        f"Recipient is {order.recipient_name} on {order.recipient_phone}.",
                    ],
                    f"Deliveroo: new run {code}. Collect at {origin}, deliver to {target}. "
                    f"Recipient {order.recipient_name} {order.recipient_phone}.",
                ),
                "admins": (
                    "Rider assigned",
                    [f"Order <strong>{code}</strong> was assigned to {courier_name}."],
                    None,
                ),
            },
        )

    if event == PICKED_UP:
        return (
            f"Your parcel has been picked up · {code}",
            {
                "customer": (
                    "Your parcel has been picked up",
                    [f"{courier_name} collected parcel <strong>{code}</strong> and is heading to {target}."],
                    f"Deliveroo: {courier_name} has collected parcel {code}. On the way to {target}.",
                ),
                "recipient": (
                    "A parcel is on its way to you",
                    [
                        f"{customer_name} has sent you a parcel. <strong>{code}</strong> was just "
                        f"collected and is on its way to {target}.",
                    ],
                    f"Deliveroo: {customer_name} sent you a parcel. {code} collected, on its way to {target}.",
                ),
                "admins": (
                    "Parcel collected",
                    [f"{courier_name} collected order <strong>{code}</strong> from {origin}."],
                    None,
                ),
            },
        )

    if event == IN_TRANSIT:
        return (
            f"Your parcel is in transit · {code}",
            {
                "customer": (
                    "Your parcel is in transit",
                    [
                        f"Parcel <strong>{code}</strong> is moving towards {target}. "
                        f"Estimated arrival in about {order.duration_min} minutes.",
                    ],
                    f"Deliveroo: parcel {code} is in transit to {target}, roughly "
                    f"{order.duration_min} minutes away.",
                ),
                "recipient": (
                    "Your parcel is on the road",
                    [
                        f"Parcel <strong>{code}</strong> is on its way to {target}, roughly "
                        f"{order.duration_min} minutes out. {courier_name} is carrying it.",
                    ],
                    f"Deliveroo: your parcel {code} is on the road to {target}, about "
                    f"{order.duration_min} minutes away.",
                ),
                "admins": (
                    "Parcel in transit",
                    [
                        f"Order <strong>{code}</strong> is on the road to {target} with "
                        f"{courier_name}, about {order.duration_min} minutes out.",
                    ],
                    None,
                ),
            },
        )

    if event == DELIVERED:
        return (
            f"Delivered · {code}",
            {
                "customer": (
                    "Your parcel has been delivered",
                    [
                        f"Parcel <strong>{code}</strong> was delivered to {order.recipient_name} at "
                        f"{target}. Thank you for using Deliveroo.",
                    ],
                    f"Deliveroo: parcel {code} delivered to {order.recipient_name} at {target}. Thank you.",
                ),
                "recipient": (
                    "Your parcel has arrived",
                    [
                        f"Parcel <strong>{code}</strong> from {customer_name} has been delivered to "
                        f"{target}.",
                    ],
                    f"Deliveroo: parcel {code} from {customer_name} has been delivered to {target}.",
                ),
                "courier": (
                    "Run complete",
                    [f"You marked <strong>{code}</strong> delivered. Nice work."],
                    f"Deliveroo: run {code} marked delivered. Nice work.",
                ),
                "admins": (
                    "Delivery completed",
                    [f"Order <strong>{code}</strong> was delivered by {courier_name}. Value {total}."],
                    None,
                ),
            },
        )

    if event == CANCELLED:
        return (
            f"Delivery cancelled · {code}",
            {
                "customer": (
                    "Your delivery was cancelled",
                    [
                        f"Parcel <strong>{code}</strong> to {target} has been cancelled. "
                        f"Nothing further will be charged.",
                    ],
                    f"Deliveroo: order {code} to {target} was cancelled. No further charges.",
                ),
                "recipient": (
                    "A delivery to you was cancelled",
                    [
                        f"The parcel <strong>{code}</strong> that was on its way to {target} "
                        f"has been cancelled by the sender.",
                    ],
                    f"Deliveroo: parcel {code} to {target} was cancelled by the sender.",
                ),
                "courier": (
                    "Run cancelled",
                    [f"Order <strong>{code}</strong> has been cancelled. No collection needed."],
                    f"Deliveroo: run {code} cancelled. No collection needed.",
                ),
                "admins": (
                    "Order cancelled",
                    [f"Order <strong>{code}</strong> was cancelled."],
                    None,
                ),
            },
        )

    if event == CASH_DECLARED:
        return (
            f"Cash payment to confirm · {code}",
            {
                "admins": (
                    "Cash payment awaiting confirmation",
                    [
                        f"{courier_name} reports collecting {total} in cash from {customer_name} "
                        f"for parcel <strong>{code}</strong>.",
                        "Open the order and confirm the payment to close it and release the receipt.",
                    ],
                    None,
                ),
            },
        )

    if event == PAYMENT_RECEIVED:
        payment = order.payment
        if payment is not None and payment.method == METHOD_CASH:
            proof = "Paid in cash to the rider and confirmed by our team."
        else:
            receipt = payment.mpesa_receipt if payment else "—"
            proof = f"M-Pesa receipt {receipt}."
        return (
            f"Payment received · {code}",
            {
                "customer": (
                    "Payment received",
                    [
                        f"We received {total} for parcel <strong>{code}</strong>. {proof}",
                    ],
                    f"Deliveroo: payment of {total} received for {code}. {proof}",
                ),
                "recipient": (
                    "Delivery to you is paid for",
                    [
                        f"The delivery of parcel <strong>{code}</strong> to {target} has been paid "
                        f"for. Nothing is owed on arrival.",
                    ],
                    f"Deliveroo: delivery of {code} to {target} is paid for. Nothing owed on arrival.",
                ),
                "admins": (
                    "Payment received",
                    [f"Order <strong>{code}</strong> was paid. {total}. {proof}"],
                    None,
                ),
            },
        )

    return None, {}


def _dispatch(party, subject, title, paragraphs, sms_text, code):
    plain = " ".join(p.replace("<strong>", "").replace("</strong>", "") for p in paragraphs)
    mailer.send_email(subject, party.get("email"), plain, mailer.wrap_html(title, paragraphs, code))
    if sms_text and party.get("sms") and party.get("phone"):
        sms.send_sms(party["phone"], sms_text)



def _plain(paragraphs):
    """Flatten the html paragraphs of one message into a single readable line."""
    text = " ".join(paragraphs)
    text = re.sub(r"<a [^>]*>(.*?)</a>", r"\1", text)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"\s+", " ", text).strip()[:400]


def _record_inapp(order, event, copy):
    """Store a notification for every party who can sign in and read it."""
    from ..models import Notification, User

    people = {}
    if order.customer is not None:
        people["customer"] = order.customer
    if order.courier is not None:
        people["courier"] = order.courier

    for key, user in people.items():
        entry = copy.get(key)
        if entry:
            Notification.record(user, event, entry[0], _plain(entry[1]), order)

    admin_entry = copy.get("admins")
    if admin_entry:
        admins = User.query.filter_by(role=ROLE_ADMIN, is_active=True).all()
        for admin in admins:
            Notification.record(admin, event, admin_entry[0], _plain(admin_entry[1]), order)

    db.session.commit()



def _client_base():
    origins = current_app.config.get("CLIENT_ORIGINS") or ["http://localhost:5173"]
    return origins[0].rstrip("/")


def delivery_receipt(order):
    """Email the final receipt once the parcel has arrived and the money has cleared."""
    if order.status != "delivered":
        return False
    if order.payment is None or order.payment.status != "paid":
        return False
    if order.receipt_sent_at is not None:
        return False

    reference = receipts.reference_for(order)
    base = _client_base()
    lines = (order.price_breakdown or {}).get("lines") or []

    rows = "".join(
        "<tr>"
        f"<td style='padding:6px 0;color:#475569;font-size:14px'>{line.get('label')}</td>"
        f"<td style='padding:6px 0;text-align:right;font-size:14px'>{_money(line.get('amount', 0))}</td>"
        "</tr>"
        for line in lines
        if line.get("amount")
    )

    detail = (
        f"<table style='width:100%;border-collapse:collapse'>{rows}"
        "<tr><td style='padding:10px 0 0;border-top:1px solid #e2e8f0;font-weight:700;font-size:14px'>Total paid</td>"
        f"<td style='padding:10px 0 0;border-top:1px solid #e2e8f0;text-align:right;font-weight:700;font-size:14px'>{_money(order.price_kes)}</td></tr>"
        "</table>"
    )

    paragraphs = [
        f"Parcel <strong>{order.tracking_code}</strong> was delivered to "
        f"{order.destination_address} on {order.delivered_at:%d %B %Y at %H:%M}.",
        f"<strong>Sent by</strong> {order.customer.name if order.customer else 'a customer'}"
        + (f" · {order.customer.phone}" if order.customer and order.customer.phone else ""),
        f"<strong>Received by</strong> {order.received_by or order.recipient_name}"
        + (f" · {order.recipient_phone}" if order.recipient_phone else ""),
        f"<strong>Delivered by</strong> {order.courier.name if order.courier else 'our rider'}"
        + (f" · {order.courier.vehicle}" if order.courier and order.courier.vehicle else ""),
        detail,
        f"M-Pesa receipt {order.payment.mpesa_receipt or '—'}.",
        f"<a href='{base}/orders/{order.id}/receipt' style='color:#9c5f02;font-weight:600'>"
        "View or download the full receipt</a>",
    ]

    plain = (
        f"Parcel {order.tracking_code} was delivered to {order.destination_address}.\n"
        f"Received by {order.received_by or order.recipient_name}.\n"
        f"Delivered by {order.courier.name if order.courier else 'our rider'}.\n"
        f"Total paid {_money(order.price_kes)}. M-Pesa receipt {order.payment.mpesa_receipt or '-'}.\n"
        f"Document reference {reference}\n"
        f"Verify at {base}/verify"
    )

    footer = (
        f"Document reference {reference} · Verify this receipt at {base}/verify · "
        "Deliveroo Logistics Kenya Ltd, Nairobi"
    )

    html = mailer.wrap_html(
        "Delivery complete", paragraphs, order.tracking_code, footer=footer
    )

    recipients = []
    if order.customer is not None and order.customer.notification_email:
        recipients.append(order.customer.notification_email)
    if order.recipient_email and order.recipient_email not in recipients:
        recipients.append(order.recipient_email)

    for address in recipients:
        mailer.send_email(f"Receipt · {order.tracking_code}", address, plain, html)

    order.receipt_sent_at = utcnow()
    db.session.commit()
    return True


def notify(order, event):
    """Fan one delivery event out to every party that should hear about it."""
    subject, copy = _copy(order, event)
    if not subject:
        return

    people = _audience(order)

    for key in ("customer", "recipient", "courier"):
        entry = copy.get(key)
        party = people.get(key)
        if entry and party:
            _dispatch(party, subject, entry[0], entry[1], entry[2], order.tracking_code)

    admin_entry = copy.get("admins")
    if admin_entry:
        for party in people.get("admins", []):
            _dispatch(
                party, subject, admin_entry[0], admin_entry[1], admin_entry[2], order.tracking_code
            )

    _record_inapp(order, event, copy)

    if event in (DELIVERED, PAYMENT_RECEIVED):
        delivery_receipt(order)


def notify_status(order):
    """Map an order's current status onto its notification event."""
    event = STATUS_EVENTS.get(order.status)
    if event:
        notify(order, event)


def channel_status():
    return {
        "email": not current_app.config.get("MAIL_SUPPRESS_SEND", True),
        "sms": sms.is_configured(),
    }


def password_reset(user, link, minutes):
    """Send a single-use password reset link. Falls back to the log when SMTP is off."""
    recipient = user.contact_email or user.email
    if not recipient:
        return False

    first = (user.name or "there").split()[0]
    title = "Reset your password"
    paragraphs = [
        "Hi " + first + ", we received a request to reset your Deliveroo password.",
        "<a href='" + link + "' style='color:#0b8c64;font-weight:600'>Choose a new password</a>",
        "This link works once and expires in " + str(minutes) + " minutes.",
        "If you did not ask for this, ignore this email and nothing will change.",
    ]
    plain = (
        "Hi " + first + ", reset your Deliveroo password here: " + link + "\n"
        "This link works once and expires in " + str(minutes) + " minutes.\n"
        "If you did not ask for this, ignore this email and nothing will change."
    )
    return mailer.send_email(
        title,
        recipient,
        plain,
        mailer.wrap_plain_html(title, paragraphs, "Deliveroo Logistics, Nairobi"),
    )

def email_verification(user, code, minutes):
    """Send the one time code a new account needs before it can sign in."""
    recipient = user.contact_email or user.email
    if not recipient:
        return False

    first = (user.name or "there").split()[0]
    title = "Confirm your email address"
    paragraphs = [
        "Hi " + first + ", welcome to Deliveroo. Use this code to finish setting up your account.",
        "<div style='font-family:monospace;font-size:30px;font-weight:700;letter-spacing:10px;"
        "padding:18px 0'>" + code + "</div>",
        "The code expires in " + str(minutes) + " minutes and can only be used once.",
        "If you did not create a Deliveroo account, ignore this email.",
    ]
    plain = (
        "Hi " + first + ", your Deliveroo confirmation code is " + code + ".\n"
        "It expires in " + str(minutes) + " minutes and can only be used once.\n"
        "If you did not create a Deliveroo account, ignore this email."
    )
    return mailer.send_email(
        title,
        recipient,
        plain,
        mailer.wrap_plain_html(title, paragraphs, "Deliveroo Logistics, Nairobi"),
    )


def rider_application(application):
    """Tell every admin that a customer has applied to ride, and confirm it to the applicant."""
    from ..models import Notification, User

    name = application.full_name
    vehicle = application.vehicle_label
    title = "New rider application"
    subject = f"New rider application · {name}"
    paragraphs = [
        f"<strong>{name}</strong> has applied to ride for Deliveroo.",
        f"Vehicle {vehicle}. Licence {application.licence_number}. Phone {application.phone}.",
        "Open the rider applications board to approve the application or turn it down.",
    ]
    body = _plain(paragraphs)

    for admin in User.query.filter_by(role=ROLE_ADMIN, is_active=True).all():
        recipient = admin.notification_email
        if recipient:
            mailer.send_email(
                subject,
                recipient,
                body,
                mailer.wrap_plain_html(title, paragraphs, "Deliveroo Logistics, Nairobi"),
            )
        Notification.record(
            admin,
            RIDER_APPLIED,
            title,
            f"{name} applied to ride with us on a {vehicle}.",
        )

    applicant = application.applicant
    if applicant is not None and applicant.notification_email:
        applicant_title = "We have your rider application"
        applicant_paragraphs = [
            f"Thanks {name.split()[0]}, your application to ride for Deliveroo is with our team.",
            "We review applications in the order they arrive and will email you either way.",
        ]
        mailer.send_email(
            "Rider application received",
            applicant.notification_email,
            _plain(applicant_paragraphs),
            mailer.wrap_plain_html(
                applicant_title, applicant_paragraphs, "Deliveroo Logistics, Nairobi"
            ),
        )

    db.session.commit()
