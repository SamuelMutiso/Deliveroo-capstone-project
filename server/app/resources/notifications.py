from flask import Blueprint
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models import Notification
from ..schemas.notification_schema import notification_schema
from ..utils.clock import utcnow
from ..utils.decorators import current_user
from ..utils.errors import NotFoundError
from ..utils.pagination import paginate

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


def _mine(user):
    return Notification.query.filter_by(user_id=user.id)


@notifications_bp.get("")
@jwt_required()
def list_notifications():
    """The signed-in user's notifications, newest first."""
    user = current_user()
    query = _mine(user).order_by(Notification.created_at.desc(), Notification.id.desc())
    payload = paginate(query, notification_schema)
    payload["unread"] = _mine(user).filter(Notification.read_at.is_(None)).count()
    return payload


@notifications_bp.get("/unread-count")
@jwt_required()
def unread_count():
    """Just the badge number, so the bell can refresh cheaply."""
    user = current_user()
    return {"unread": _mine(user).filter(Notification.read_at.is_(None)).count()}


@notifications_bp.patch("/<int:notification_id>/read")
@jwt_required()
def mark_read(notification_id):
    user = current_user()
    notification = _mine(user).filter_by(id=notification_id).first()
    if notification is None:
        raise NotFoundError("Notification not found")

    notification.mark_read()
    db.session.commit()
    return {"notification": notification_schema.dump(notification)}


@notifications_bp.post("/read-all")
@jwt_required()
def mark_all_read():
    user = current_user()
    _mine(user).filter(Notification.read_at.is_(None)).update(
        {"read_at": utcnow()}, synchronize_session=False
    )
    db.session.commit()
    return {"unread": 0}
