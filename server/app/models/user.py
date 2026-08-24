from sqlalchemy.orm import validates

from ..constants import ROLE_CUSTOMER, USER_ROLES
from ..extensions import bcrypt, db
from ..utils.clock import utcnow


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), nullable=False, unique=True, index=True)
    phone = db.Column(db.String(24))
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default=ROLE_CUSTOMER, index=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    vehicle = db.Column(db.String(60))
    photo_url = db.Column(db.Text)
    contact_email = db.Column(db.String(180))
    is_available = db.Column(db.Boolean, nullable=False, default=False)
    current_lat = db.Column(db.Float)
    current_lng = db.Column(db.Float)
    last_seen_at = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    orders = db.relationship(
        "Order",
        back_populates="customer",
        foreign_keys="Order.customer_id",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    deliveries = db.relationship(
        "Order",
        back_populates="courier",
        foreign_keys="Order.courier_id",
        lazy="dynamic",
    )
    applications = db.relationship(
        "CourierApplication",
        back_populates="applicant",
        foreign_keys="CourierApplication.applicant_id",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )

    @property
    def notification_email(self):
        """Where mail actually goes. Riders log in with a company address that has no inbox."""
        return self.contact_email or self.email

    @property
    def password(self):
        raise AttributeError("password is write only")

    @password.setter
    def password(self, raw):
        self.password_hash = bcrypt.generate_password_hash(raw).decode("utf-8")

    def verify_password(self, raw):
        return bcrypt.check_password_hash(self.password_hash, raw)

    @validates("role")
    def validate_role(self, _key, value):
        if value not in USER_ROLES:
            raise ValueError(f"role must be one of {', '.join(USER_ROLES)}")
        return value

    @validates("email")
    def validate_email(self, _key, value):
        cleaned = (value or "").strip().lower()
        if "@" not in cleaned or "." not in cleaned.split("@")[-1]:
            raise ValueError("a valid email address is required")
        return cleaned

    def touch_location(self, lat, lng):
        self.current_lat = lat
        self.current_lng = lng
        self.last_seen_at = utcnow()

    def __repr__(self):
        return f"<User {self.id} {self.email} {self.role}>"
