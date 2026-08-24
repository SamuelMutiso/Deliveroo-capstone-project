import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))


def _flag(name, default="0"):
    return os.getenv(name, default).lower() in ("1", "true", "yes", "on")


def _database_uri():
    uri = os.getenv("DATABASE_URL", "")
    if uri.startswith("postgres://"):
        uri = uri.replace("postgres://", "postgresql://", 1)
    if not uri:
        uri = "sqlite:///" + os.path.join(BASE_DIR, "deliveroo.db")
    return uri


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = _database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    JSON_SORT_KEYS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("SECRET_KEY", "dev-jwt-secret"))
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=14)
    JWT_ERROR_MESSAGE_KEY = "message"

    CLIENT_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CLIENT_ORIGIN", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    ]

    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USE_TLS = _flag("MAIL_USE_TLS", "1")
    MAIL_USE_SSL = _flag("MAIL_USE_SSL", "0")
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", "Deliveroo <no-reply@deliveroo.co.ke>")
    MAIL_SUPPRESS_SEND = not bool(os.getenv("MAIL_USERNAME", ""))

    AT_ENV = os.getenv("AT_ENV", "sandbox")
    AT_USERNAME = os.getenv("AT_USERNAME", "")
    AT_API_KEY = os.getenv("AT_API_KEY", "")
    AT_SENDER_ID = os.getenv("AT_SENDER_ID", "")

    MPESA_ENV = os.getenv("MPESA_ENV", "sandbox")
    MPESA_CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY", "")
    MPESA_CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET", "")
    MPESA_SHORTCODE = os.getenv("MPESA_SHORTCODE", "174379")
    MPESA_PASSKEY = os.getenv("MPESA_PASSKEY", "")
    MPESA_CALLBACK_URL = os.getenv("MPESA_CALLBACK_URL", "")

    BASE_RATE_KES = float(os.getenv("BASE_RATE_KES", "180"))
    PRICE_PER_KM_KES = float(os.getenv("PRICE_PER_KM_KES", "42"))

    DEFAULT_PAGE_SIZE = 10
    MAX_PAGE_SIZE = 50


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    MAIL_SUPPRESS_SEND = True
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)


class ProductionConfig(Config):
    DEBUG = False


CONFIGS = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config(name=None):
    key = name or os.getenv("FLASK_ENV", "development")
    return CONFIGS.get(key, DevelopmentConfig)
