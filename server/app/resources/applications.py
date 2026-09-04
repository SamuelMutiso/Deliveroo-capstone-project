from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from ..constants import (
    APPLICATION_APPROVED,
    APPLICATION_PENDING,
    APPLICATION_REJECTED,
    ROLE_CUSTOMER,
    VEHICLE_TYPES,
)
from ..extensions import db
from ..models import CourierApplication
from ..schemas import courier_application_create_schema, courier_application_schema
from ..services import notifications
from ..utils.decorators import current_user
from ..utils.errors import ApiError, ConflictError

applications_bp = Blueprint("applications", __name__, url_prefix="/api/courier-applications")


@applications_bp.get("/vehicle-types")
def vehicle_types():
    """Options for the become-a-rider form."""
    return {"vehicle_types": [{"value": value, "label": label} for value, label in VEHICLE_TYPES]}


@applications_bp.get("/mine")
@jwt_required()
def my_application():
    """The signed-in customer's most recent application, if they have one."""
    user = current_user()
    application = (
        CourierApplication.query.filter_by(applicant_id=user.id)
        .order_by(CourierApplication.created_at.desc())
        .first()
    )
    return {"application": courier_application_schema.dump(application) if application else None}


@applications_bp.post("")
@jwt_required()
def apply():
    """A customer applies to ride for the company."""
    user = current_user()

    if user.role != ROLE_CUSTOMER:
        raise ApiError("Only customer accounts can apply to become a rider", 403)

    existing = CourierApplication.query.filter(
        CourierApplication.applicant_id == user.id,
        CourierApplication.status.in_((APPLICATION_PENDING, APPLICATION_APPROVED)),
    ).first()

    if existing is not None:
        message = (
            "You already have an application waiting for review"
            if existing.status == APPLICATION_PENDING
            else "You have already been approved as a rider"
        )
        raise ConflictError(message)

    data = courier_application_create_schema.load(request.get_json() or {})

    application = CourierApplication(
        applicant_id=user.id,
        full_name=data["full_name"].strip(),
        phone=data["phone"].strip(),
        licence_number=data["licence_number"].strip().upper(),
        vehicle_type=data["vehicle_type"],
        vehicle_ownership=data["vehicle_ownership"],
        vehicle_registration=(data.get("vehicle_registration") or "").strip().upper() or None,
        vehicle_photo_url=data.get("vehicle_photo_url"),
        profile_photo_url=data["profile_photo_url"],
        status=APPLICATION_PENDING,
    )

    db.session.add(application)
    db.session.commit()

    notifications.rider_application(application)

    return {"application": courier_application_schema.dump(application)}, 201


@applications_bp.delete("/<int:application_id>")
@jwt_required()
def withdraw(application_id):
    """Withdraw an application that has not been reviewed yet."""
    user = current_user()
    application = db.session.get(CourierApplication, application_id)

    if application is None or application.applicant_id != user.id:
        raise ApiError("Application not found", 404)
    if application.status != APPLICATION_PENDING:
        raise ConflictError(f"An application that is already {application.status} cannot be withdrawn")

    application.status = APPLICATION_REJECTED
    application.review_note = "Withdrawn by the applicant"
    db.session.commit()

    return {"application": courier_application_schema.dump(application)}
