from marshmallow import Schema, ValidationError, fields, validate, validates

from ..constants import ROLE_CUSTOMER, USER_ROLES
from ..utils.phone import PhoneField


class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=120))
    email = fields.Email(required=True)
    phone = fields.Str(allow_none=True, validate=validate.Length(max=24))
    role = fields.Str(dump_only=True)
    is_active = fields.Bool(dump_only=True)
    vehicle = fields.Str(allow_none=True)
    photo_url = fields.Str(allow_none=True)
    contact_email = fields.Email(allow_none=True, dump_only=True)
    is_available = fields.Bool(dump_only=True)
    current_lat = fields.Float(allow_none=True)
    current_lng = fields.Float(allow_none=True)
    last_seen_at = fields.DateTime(dump_only=True)
    created_at = fields.DateTime(dump_only=True)


class UserSummarySchema(Schema):
    id = fields.Int()
    name = fields.Str()
    email = fields.Email()
    phone = fields.Str()
    role = fields.Str()
    vehicle = fields.Str()
    photo_url = fields.Str()
    is_available = fields.Bool()
    current_lat = fields.Float()
    current_lng = fields.Float()


class RegisterSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=120))
    email = fields.Email(required=True)
    phone = PhoneField(load_default=None, allow_none=True)
    password = fields.Str(
        required=True,
        load_only=True,
        validate=validate.Length(min=8, error="Password must be at least 8 characters"),
    )
    role = fields.Str(load_default=ROLE_CUSTOMER, validate=validate.OneOf(USER_ROLES))


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)


class ProfileUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(min=2, max=120))
    phone = PhoneField(allow_none=True)
    vehicle = fields.Str(allow_none=True, validate=validate.Length(max=60))
    photo_url = fields.Str(allow_none=True, validate=validate.Length(max=400_000))

    @validates("photo_url")
    def check_photo(self, value, **_kwargs):
        if value and not value.startswith("data:image/"):
            raise ValidationError("Photo must be an image")


class AvailabilitySchema(Schema):
    is_available = fields.Bool(required=True)


class PasswordChangeSchema(Schema):
    current_password = fields.Str(required=True, load_only=True)
    new_password = fields.Str(
        required=True,
        load_only=True,
        validate=validate.Length(min=8, error="Password must be at least 8 characters"),
    )


class ForgotPasswordSchema(Schema):
    email = fields.Email(required=True)


class ResetPasswordSchema(Schema):
    token = fields.Str(required=True, load_only=True)
    new_password = fields.Str(
        required=True,
        load_only=True,
        validate=validate.Length(min=8, error="Password must be at least 8 characters"),
    )


class AdminUserUpdateSchema(Schema):
    role = fields.Str(validate=validate.OneOf(USER_ROLES))
    is_active = fields.Bool()


user_schema = UserSchema()
user_summary_schema = UserSummarySchema()
register_schema = RegisterSchema()
login_schema = LoginSchema()
profile_update_schema = ProfileUpdateSchema()
admin_user_update_schema = AdminUserUpdateSchema()
availability_schema = AvailabilitySchema()
password_change_schema = PasswordChangeSchema()
forgot_password_schema = ForgotPasswordSchema()
reset_password_schema = ResetPasswordSchema()
