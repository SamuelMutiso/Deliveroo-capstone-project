from ..extensions import db
from ..utils.clock import utcnow


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), index=True)

    event = db.Column(db.String(40), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    body = db.Column(db.String(400), nullable=False)

    read_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False, index=True)

    user = db.relationship("User", foreign_keys=[user_id])
    order = db.relationship("Order", foreign_keys=[order_id])

    @property
    def is_read(self):
        return self.read_at is not None

    @classmethod
    def record(cls, user, event, title, body, order=None):
        """Store one notification for a user who can sign in and read it."""
        if user is None or user.id is None:
            return None

        notification = cls(
            user_id=user.id,
            order_id=order.id if order is not None else None,
            event=event,
            title=title,
            body=body,
        )
        db.session.add(notification)
        return notification

    def mark_read(self):
        if self.read_at is None:
            self.read_at = utcnow()

    def __repr__(self):
        return f"<Notification {self.user_id} {self.event}>"
