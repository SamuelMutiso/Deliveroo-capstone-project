from threading import Thread

from flask import current_app
from flask_mail import Message

from ..extensions import mail


def _send_async(app, message):
    with app.app_context():
        try:
            mail.send(message)
        except Exception as error:
            app.logger.warning("Email delivery failed: %s", error)


def send_email(subject, recipient, body, html=None):
    """Queue one email. Logs instead of sending when SMTP is not configured."""
    if not recipient:
        return False

    app = current_app._get_current_object()

    if app.config.get("MAIL_SUPPRESS_SEND"):
        app.logger.info("Email suppressed -> %s | %s", recipient, subject)
        return False

    message = Message(subject=subject, recipients=[recipient], body=body, html=html)
    Thread(target=_send_async, args=(app, message), daemon=True).start()
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