from ..extensions import db
from ..models import AuditEvent

PAYMENT_CONFIRMED = "payment.cash_confirmed"
PAYMENT_REJECTED = "payment.cash_rejected"
RIDER_APPROVED = "rider.approved"
RIDER_REJECTED = "rider.rejected"
ORDER_ASSIGNED = "order.assigned"
ORDER_STATUS_FORCED = "order.status_changed"
USER_UPDATED = "user.updated"


def record(actor, action, subject_type, subject_id, summary):
    """Note a privileged action. Never raises — an audit failure must not undo the work."""
    try:
        db.session.add(
            AuditEvent(
                actor_id=getattr(actor, "id", None),
                actor_name=getattr(actor, "name", "unknown"),
                actor_role=getattr(actor, "role", "unknown"),
                action=action,
                subject_type=subject_type,
                subject_id=str(subject_id),
                summary=summary[:255],
            )
        )
        db.session.commit()
    except Exception:  # noqa: BLE001
        db.session.rollback()
