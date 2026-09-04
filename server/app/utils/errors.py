from flask import request
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import HTTPException

from ..extensions import db


class ApiError(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, details=None):
        super().__init__(message)
        self.message = message
        self.details = details
        if status_code is not None:
            self.status_code = status_code

    def to_dict(self):
        payload = {"message": self.message}
        if self.details:
            payload["errors"] = self.details
        return payload


class NotFoundError(ApiError):
    status_code = 404


class ForbiddenError(ApiError):
    status_code = 403


class ConflictError(ApiError):
    status_code = 409


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(error):
        return error.to_dict(), error.status_code

    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return {"message": "Validation failed", "errors": error.messages}, 422

    @app.errorhandler(ValueError)
    def handle_value_error(error):
        return {"message": str(error)}, 400

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(_error):
        db.session.rollback()
        return {"message": "That record conflicts with one that already exists"}, 409

    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        return {"message": error.description}, error.code

    @app.errorhandler(Exception)
    def handle_unexpected(error):
        db.session.rollback()
        app.logger.exception(
            "Unhandled error on %s %s: %s", request.method, request.path, error
        )
        return {"message": "Something went wrong on our side"}, 500