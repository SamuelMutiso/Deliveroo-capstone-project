from ..extensions import db
from ..utils.clock import utcnow


class AuditEvent(db.Model):
    """Who used their authority, on what, and when. Written once, never edited."""

    __tablename__ = "audit_events"

    id = db.Column(db.Integer, primary_key=True)
    actor_id = db.Column(db.Integer, db.ForeignKey("users.id"), index=True)
    actor_name = db.Column(db.String(120), nullable=False)
    actor_role = db.Column(db.String(20), nullable=False)

    action = db.Column(db.String(60), nullable=False, index=True)
    subject_type = db.Column(db.String(40), nullable=False)
    subject_id = db.Column(db.String(40), nullable=False)
    summary = db.Column(db.String(255), nullable=False)

    created_at = db.Column(db.DateTime, default=utcnow, nullable=False, index=True)

    actor = db.relationship("User")

    def __repr__(self):
        return f"<AuditEvent {self.action} by {self.actor_name}>"
