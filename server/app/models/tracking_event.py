from ..extensions import db
from ..utils.clock import utcnow


class TrackingEvent(db.Model):
    __tablename__ = "tracking_events"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False, index=True)
    actor_id = db.Column(db.Integer, db.ForeignKey("users.id"))

    status = db.Column(db.String(20), nullable=False)
    note = db.Column(db.String(255))
    lat = db.Column(db.Float)
    lng = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False, index=True)

    order = db.relationship("Order", back_populates="events")
    actor = db.relationship("User", foreign_keys=[actor_id])

    @classmethod
    def record(cls, order, status, note=None, actor=None, lat=None, lng=None):
        event = cls(
            order=order,
            status=status,
            note=note,
            actor_id=actor.id if actor else None,
            lat=lat if lat is not None else order.current_lat,
            lng=lng if lng is not None else order.current_lng,
        )
        db.session.add(event)
        return event

    def __repr__(self):
        return f"<TrackingEvent {self.order_id} {self.status}>"