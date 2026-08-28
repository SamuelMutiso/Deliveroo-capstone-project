from threading import Thread

import requests
from flask import current_app
from flask_mail import Message

from ..extensions import mail

BREVO_URL = "https://api.brevo.com/v3/smtp/email"
BREVO_TIMEOUT = 15


def _sender_parts(raw):
    """Split 'Deliveroo <a@b.com>' into a name and an address."""
    value = (raw or "").strip()
    if "<" in value and value.endswith(">"):
        name, _, address = value.partition("<")
        return name.strip() or "Deliveroo", address[:-1].strip()
    return "Deliveroo", value


def _send_via_brevo(app, api_key, subject, recipient, body, html):
    name, address = _sender_parts(app.config.get("MAIL_DEFAULT_SENDER"))
    payload = {
        "sender": {"name": name, "email": address},
        "to": [{"email": recipient}],
        "subject": subject,
        "textContent": body,
    }
    if html:
        payload["htmlContent"] = html

    try:
        response = requests.post(
            BREVO_URL,
            json=payload,
            headers={"api-key": api_key, "accept": "application/json"},
            timeout=BREVO_TIMEOUT,
        )
    except requests.RequestException as error:
        app.logger.warning("Email delivery failed (brevo): %s", error)
        return

    if response.status_code >= 300:
        app.logger.warning(
            "Email delivery failed (brevo %s): %s", response.status_code, response.text[:300]
        )
    else:
        app.logger.warning("Email delivered (brevo) -> %s | %s", recipient, subject)


def _send_via_smtp(app, message):
    with app.app_context():
        try:
            mail.send(message)
        except Exception as error:
            app.logger.warning("Email delivery failed (smtp): %s", error)
        else:
            app.logger.warning("Email delivered (smtp) -> %s", message.recipients)


def send_email(subject, recipient, body, html=None):
    """Queue one email. Uses Brevo over HTTPS when configured, SMTP otherwise."""
    if not recipient:
        return False

    app = current_app._get_current_object()

    if app.config.get("MAIL_SUPPRESS_SEND"):
        app.logger.warning("Email suppressed (no MAIL_USERNAME) -> %s | %s", recipient, subject)
        return False

    api_key = app.config.get("BREVO_API_KEY")

    if api_key:
        app.logger.warning("Email sending (brevo) -> %s | %s", recipient, subject)
        Thread(
            target=_send_via_brevo,
            args=(app, api_key, subject, recipient, body, html),
            daemon=True,
        ).start()
        return True

    app.logger.warning("Email sending (smtp) -> %s | %s", recipient, subject)
    message = Message(subject=subject, recipients=[recipient], body=body, html=html)
    Thread(target=_send_via_smtp, args=(app, message), daemon=True).start()
    return True


def wrap_html(title, paragraphs, code, footer=None):
    blocks = "".join(f"<p style='margin:0 0 14px;line-height:1.6'>{p}</p>" for p in paragraphs)
    tail = (
        f"<p style='margin:20px 0 0;font-size:13px;color:#64748b'>{footer}</p>" if footer else ""
    )
    return f"""
    <div style="font-family:Helvetica,Arial,sans-serif;background:#f1f5f9;padding:32px">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;padding:32px">
        <p style="margin:0 0 6px;letter-spacing:.14em;font-size:11px;color:#64748b">DELIVEROO</p>
        <h1 style="margin:0 0 18px;font-size:22px;color:#0f172a">{title}</h1>
        {blocks}
        <p style="margin:24px 0 0;font-size:13px;color:#64748b">
          Tracking reference <strong style="color:#0b8c64">{code}</strong>
        </p>
        {tail}
      </div>
    </div>
    """


def wrap_plain_html(title, paragraphs, footer=None):
    blocks = "".join("<p style='margin:0 0 14px;line-height:1.6'>" + p + "</p>" for p in paragraphs)
    tail = (
        "<p style='margin:20px 0 0;font-size:13px;color:#64748b'>" + footer + "</p>"
        if footer
        else ""
    )
    return (
        "<div style=\"font-family:Helvetica,Arial,sans-serif;background:#f1f5f9;padding:32px\">"
        "<div style=\"max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;padding:32px\">"
        "<p style=\"margin:0 0 6px;letter-spacing:.14em;font-size:11px;color:#64748b\">DELIVEROO</p>"
        "<h1 style=\"margin:0 0 18px;font-size:22px;color:#0f172a\">" + title + "</h1>"
        + blocks + tail +
        "</div></div>"
    )
