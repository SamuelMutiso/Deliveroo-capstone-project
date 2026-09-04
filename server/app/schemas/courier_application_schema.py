from marshmallow import Schema, ValidationError, fields, validate, validates, validates_schema

from ..constants import VEHICLE_OWNERSHIP, VEHICLE_TYPE_VALUES
from ..utils.phone import PhoneField
from .user_schema import UserSummarySchema

PHOTO_MAX = 400_000


def _image(value):
    if value and not value.startswith("data:image/"):
        raise ValidationError("Must be an image")


class CourierApplicationSchema(Schema):
    id = fields.Int(dump_only=True)
    full_name = fields.Str(dump_only=True)
    phone = fields.Str(dump_only=True)
    licence_number = fields.Str(dump_only=True)
    vehicle_type = fields.Str(dump_only=True)
    vehicle_ownership = fields.Str(dump_only=True)
    vehicle_registration = fields.Str(dump_only=True)
    vehicle_label = fields.Str(dump_only=True)
    vehicle_photo_url = fields.Str(dump_only=True)
    profile_photo_url = fields.Str(dump_only=True)
    status = fields.Str(dump_only=True)
    review_note = fields.Str(dump_only=True)
    company_email = fields.Str(dump_only=True)
    temporary_password = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    reviewed_at = fields.DateTime(dump_only=True)

    applicant = fields.Nested(UserSummarySchema, dump_only=True)
    courier = fields.Nested(UserSummarySchema, dump_only=True, allow_none=True)
    reviewed_by = fields.Nested(UserSummarySchema, dump_only=True, allow_none=True)


class CourierApplicationCreateSchema(Schema):
    full_name = fields.Str(required=True, validate=validate.Length(min=2, max=120))
    phone = PhoneField(required=True)
    licence_number = fields.Str(required=True, validate=validate.Length(min=4, max=40))
    vehicle_type = fields.Str(required=True, validate=validate.OneOf(VEHICLE_TYPE_VALUES))
    vehicle_ownership = fields.Str(
        load_default="own", validate=validate.OneOf(VEHICLE_OWNERSHIP)
    )
    vehicle_registration = fields.Str(
        load_default=None, allow_none=True, validate=validate.Length(max=40)
    )
    vehicle_photo_url = fields.Str(
        load_default=None, allow_none=True, validate=validate.Length(max=PHOTO_MAX)
    )
    profile_photo_url = fields.Str(
        required=True, validate=validate.Length(max=PHOTO_MAX)
    )

    @validates("vehicle_photo_url")
    def check_vehicle_photo(self, value, **_kwargs):
        _image(value)

    @validates("profile_photo_url")
    def check_profile_photo(self, value, **_kwargs):
        _image(value)

    @validates_schema
    def own_vehicle_needs_details(self, data, **_kwargs):
        if data.get("vehicle_ownership") != "own":
            return
        errors = {}
        if not (data.get("vehicle_registration") or "").strip():
            errors["vehicle_registration"] = ["Give the number plate of your own vehicle"]
        if not data.get("vehicle_photo_url"):
            errors["vehicle_photo_url"] = ["Add a photo of your own vehicle"]
        if errors:
            raise ValidationError(errors)


class ApplicationDecisionSchema(Schema):
    note = fields.Str(load_default=None, allow_none=True, validate=validate.Length(max=400))


courier_application_schema = CourierApplicationSchema()
courier_application_create_schema = CourierApplicationCreateSchema()
application_decision_schema = ApplicationDecisionSchema()
