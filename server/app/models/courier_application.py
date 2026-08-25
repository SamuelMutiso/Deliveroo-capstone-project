from ..constants import (
    APPLICATION_PENDING,
    APPLICATION_STATUSES,
    VEHICLE_OWNERSHIP,
    VEHICLE_TYPES,
)
from ..extensions import db
from ..utils.clock import utcnow


class CourierApplication(db.Model):
    __tablename__ = "courier_applications"

    id = db.Column(db.Integer, primary_key=True)

    applicant_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    courier_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    reviewed_by_id = db.Column(db.Integer, db.ForeignKey("users.id"))

    full_name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(24), nullable=False)
    licence_number = db.Column(db.String(40), nullable=False)

    vehicle_type = db.Column(db.String(20), nullable=False)
    vehicle_ownership = db.Column(db.String(20), nullable=False, default="own")
    vehicle_registration = db.Column(db.String(40))
    vehicle_photo_url = db.Column(db.Text)
    profile_photo_url = db.Column(db.Text)

    status = db.Column(db.String(20), nullable=False, default=APPLICATION_PENDING, index=True)
    review_note = db.Column(db.String(400))
    company_email = db.Column(db.String(180))
    temporary_password = db.Column(db.String(60))

    created_at = db.Column(db.DateTime, default=utcnow, nullable=False, index=True)
    reviewed_at = db.Column(db.DateTime)

    applicant = db.relationship("User", foreign_keys=[applicant_id], back_populates="applications")
    courier = db.relationship("User", foreign_keys=[courier_id])
    reviewed_by = db.relationship("User", foreign_keys=[reviewed_by_id])

    @property
    def vehicle_label(self):
        kind = dict(VEHICLE_TYPES).get(self.vehicle_type, self.vehicle_type)
        if self.vehicle_ownership == "company":
            return f"Company {kind.lower()}"
        return f"{kind} {self.vehicle_registration}".strip()

    @property
    def is_pending(self):
        return self.status == APPLICATION_PENDING

    def __repr__(self):
        return f"<CourierApplication {self.id} {self.full_name} {self.status}>"


__all__ = ["CourierApplication", "APPLICATION_STATUSES", "VEHICLE_OWNERSHIP"]
