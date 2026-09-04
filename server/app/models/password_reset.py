import hashlib
import secrets
from datetime import timedelta

from ..extensions import db
from ..utils.clock import utcnow

TOKEN_TTL_MINUTES = 30


class PasswordResetToken(db.Model):
    __tablename__ = "password_reset_tokens"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash = db.Column(db.String(64), nullable=False, unique=True, index=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    used_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    user = db.relationship("User")

    @staticmethod
    def hash_token(raw):
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    @classmethod
    def issue(cls, user, ttl_minutes=TOKEN_TTL_MINUTES):
        raw = secrets.token_urlsafe(32)
        record = cls(
            user_id=user.id,
            token_hash=cls.hash_token(raw),
            expires_at=utcnow() + timedelta(minutes=ttl_minutes),
        )
        return record, raw

    @property
    def is_valid(self):
        return self.used_at is None and self.expires_at > utcnow()
