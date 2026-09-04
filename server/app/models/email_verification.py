import hashlib
import secrets
from datetime import timedelta

from ..extensions import db
from ..utils.clock import utcnow

CODE_TTL_MINUTES = 15
CODE_LENGTH = 6
MAX_ATTEMPTS = 5


class EmailVerification(db.Model):
    __tablename__ = "email_verifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code_hash = db.Column(db.String(64), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    consumed_at = db.Column(db.DateTime)
    attempts = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    user = db.relationship("User")

    @staticmethod
    def hash_code(raw):
        return hashlib.sha256((raw or "").encode("utf-8")).hexdigest()

    @classmethod
    def issue(cls, user, ttl_minutes=CODE_TTL_MINUTES):
        raw = "".join(secrets.choice("0123456789") for _ in range(CODE_LENGTH))
        record = cls(
            user_id=user.id,
            code_hash=cls.hash_code(raw),
            expires_at=utcnow() + timedelta(minutes=ttl_minutes),
        )
        return record, raw

    @property
    def is_live(self):
        return (
            self.consumed_at is None
            and self.attempts < MAX_ATTEMPTS
            and self.expires_at > utcnow()
        )
