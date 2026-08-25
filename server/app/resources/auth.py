from flask import Blueprint, current_app, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt,
    jwt_required,
)

from ..constants import ROLE_ADMIN
from ..extensions import db
from ..models import PasswordResetToken, User
from ..models.password_reset import TOKEN_TTL_MINUTES
from ..schemas import (
    forgot_password_schema,
    login_schema,
    password_change_schema,
    profile_update_schema,
    register_schema,
    reset_password_schema,
    user_schema,
)
from ..services import notifications
from ..utils.clock import utcnow
from ..utils.decorators import REVOKED_TOKENS, current_user
from ..utils.errors import ApiError, ConflictError

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def issue_tokens(user):
    claims = {"role": user.role, "name": user.name}
    identity = str(user.id)
    return {
        "access_token": create_access_token(identity=identity, additional_claims=claims),
        "refresh_token": create_refresh_token(identity=identity, additional_claims=claims),
    }


@auth_bp.post("/register")
def register():
    """Create an account and return a token pair."""
    data = register_schema.load(request.get_json() or {})

    if data["role"] == ROLE_ADMIN:
        raise ApiError("Admin accounts are provisioned internally", 403)

    if User.query.filter_by(email=data["email"].lower()).first():
        raise ConflictError("An account with that email already exists")

    user = User(
        name=data["name"].strip(),
        email=data["email"],
        phone=data.get("phone"),
        role=data["role"],
    )
    user.password = data["password"]

    db.session.add(user)
    db.session.commit()

    return {"user": user_schema.dump(user), **issue_tokens(user)}, 201


@auth_bp.post("/login")
def login():
    """Exchange email and password for a token pair."""
    data = login_schema.load(request.get_json() or {})
    user = User.query.filter_by(email=data["email"].lower()).first()

    if user is None or not user.verify_password(data["password"]):
        raise ApiError("Those credentials did not match our records", 401)
    if not user.is_active:
        raise ApiError("This account has been deactivated", 403)

    return {"user": user_schema.dump(user), **issue_tokens(user)}


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    """Issue a fresh access token from a valid refresh token."""
    user = current_user()
    claims = {"role": user.role, "name": user.name}
    return {"access_token": create_access_token(identity=str(user.id), additional_claims=claims)}


@auth_bp.get("/me")
@jwt_required()
def me():
    """Return the authenticated user's profile."""
    return {"user": user_schema.dump(current_user())}


@auth_bp.patch("/me")
@jwt_required()
def update_me():
    """Update the authenticated user's own profile fields."""
    user = current_user()
    data = profile_update_schema.load(request.get_json() or {})
    for field, value in data.items():
        setattr(user, field, value)
    db.session.commit()
    return {"user": user_schema.dump(user)}


@auth_bp.post("/change-password")
@jwt_required()
def change_password():
    """Swap the signed-in user's password after checking the current one."""
    user = current_user()
    data = password_change_schema.load(request.get_json() or {})

    if not user.verify_password(data["current_password"]):
        raise ApiError("Your current password is not correct", 400)
    if data["current_password"] == data["new_password"]:
        raise ApiError("The new password must be different from the current one", 422)

    user.password = data["new_password"]
    db.session.commit()

    return {"message": "Password updated"}


def _reset_link(raw_token):
    origins = current_app.config.get("CLIENT_ORIGINS") or ["http://localhost:5173"]
    base = current_app.config.get("APP_BASE_URL") or origins[0]
    return base.rstrip("/") + "/reset-password?token=" + raw_token


@auth_bp.post("/forgot-password")
def forgot_password():
    """Start a password reset. The response never reveals whether the email exists."""
    data = forgot_password_schema.load(request.get_json() or {})
    email = data["email"].strip().lower()

    user = User.query.filter(db.func.lower(User.email) == email).first()

    if user is not None and user.is_active:
        PasswordResetToken.query.filter_by(user_id=user.id, used_at=None).update(
            {"used_at": utcnow()}
        )
        record, raw = PasswordResetToken.issue(user)
        db.session.add(record)
        db.session.commit()
        notifications.password_reset(user, _reset_link(raw), TOKEN_TTL_MINUTES)

    return {"message": "If that email is registered, a reset link is on its way."}


@auth_bp.post("/reset-password")
def reset_password():
    """Finish a password reset using the single-use token from the email."""
    data = reset_password_schema.load(request.get_json() or {})
    record = PasswordResetToken.query.filter_by(
        token_hash=PasswordResetToken.hash_token(data["token"])
    ).first()

    if record is None or not record.is_valid:
        raise ApiError("This reset link is invalid or has already been used", 400)

    user = record.user
    if user is None or not user.is_active:
        raise ApiError("This account can no longer be reset", 400)

    user.password = data["new_password"]
    record.used_at = utcnow()
    db.session.commit()

    return {"message": "Password reset. You can sign in now."}


@auth_bp.post("/logout")
@jwt_required(verify_type=False)
def logout():
    """Revoke the presented token so it can no longer be used."""
    REVOKED_TOKENS.add(get_jwt()["jti"])
    return {"message": "Signed out"}
