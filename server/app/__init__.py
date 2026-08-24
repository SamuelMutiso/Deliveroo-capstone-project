from flask import Flask, jsonify

from .config import get_config
from .extensions import bcrypt, cors, db, jwt, mail, migrate
from .resources import BLUEPRINTS
from .utils.decorators import REVOKED_TOKENS
from .utils.errors import register_error_handlers


def create_app(config_name=None):
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CLIENT_ORIGINS"]}},
        supports_credentials=True,
    )

    from . import models  # noqa: F401

    register_jwt_callbacks()
    register_error_handlers(app)

    for blueprint in BLUEPRINTS:
        app.register_blueprint(blueprint)

    @app.get("/api/health")
    def health():
        return jsonify(status="ok", service="deliveroo-api")

    @app.shell_context_processor
    def shell_context():
        from .models import Order, Payment, TrackingEvent, User

        return {
            "db": db,
            "User": User,
            "Order": Order,
            "TrackingEvent": TrackingEvent,
            "Payment": Payment,
        }

    return app


def register_jwt_callbacks():
    @jwt.token_in_blocklist_loader
    def check_revoked(_header, payload):
        return payload["jti"] in REVOKED_TOKENS

    @jwt.revoked_token_loader
    def revoked_response(_header, _payload):
        return jsonify(message="This session has been signed out"), 401

    @jwt.expired_token_loader
    def expired_response(_header, _payload):
        return jsonify(message="Your session has expired, please sign in again"), 401

    @jwt.invalid_token_loader
    def invalid_response(_reason):
        return jsonify(message="Your session token is not valid"), 401

    @jwt.unauthorized_loader
    def missing_response(_reason):
        return jsonify(message="Sign in to access this resource"), 401
