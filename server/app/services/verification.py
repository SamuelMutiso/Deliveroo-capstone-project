from ..extensions import db
from ..models import EmailVerification
from ..models.email_verification import CODE_TTL_MINUTES, MAX_ATTEMPTS
from ..utils.clock import utcnow
from ..utils.errors import ApiError

RESEND_COOLDOWN_SECONDS = 60


def _open_code(user):
    return (
        EmailVerification.query.filter_by(user_id=user.id, consumed_at=None)
        .order_by(EmailVerification.id.desc())
        .first()
    )


def issue(user):
    """Retire whatever code the account is holding and hand back a fresh one."""
    EmailVerification.query.filter_by(user_id=user.id, consumed_at=None).update(
        {"consumed_at": utcnow()}
    )
    record, raw = EmailVerification.issue(user)
    db.session.add(record)
    db.session.commit()
    return raw, CODE_TTL_MINUTES


def seconds_until_resend(user):
    record = (
        EmailVerification.query.filter_by(user_id=user.id)
        .order_by(EmailVerification.id.desc())
        .first()
    )
    if record is None:
        return 0
    elapsed = (utcnow() - record.created_at).total_seconds()
    return max(0, int(RESEND_COOLDOWN_SECONDS - elapsed))


def check(user, code):
    """Consume a code. Raises when it is wrong, stale or has been guessed at too often."""
    record = _open_code(user)
    if record is None:
        raise ApiError("Ask for a new code and try again", 400)
    if record.expires_at <= utcnow():
        raise ApiError("That code has expired. Ask for a new one", 400)
    if record.attempts >= MAX_ATTEMPTS:
        raise ApiError("Too many wrong attempts. Ask for a new code", 429)

    record.attempts += 1
    if record.code_hash != EmailVerification.hash_code(code):
        db.session.commit()
        raise ApiError("That code is not right", 400)

    record.consumed_at = utcnow()
    user.email_verified = True
    db.session.commit()
    return user
