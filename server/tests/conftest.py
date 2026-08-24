import pytest

from app import create_app
from app.constants import ROLE_ADMIN, ROLE_COURIER, ROLE_CUSTOMER
from app.extensions import db as _db
from app.models import User


@pytest.fixture
def app():
    application = create_app("testing")
    with application.app_context():
        _db.create_all()
        yield application
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db(app):
    return _db


def make_user(name, email, role, password="password123"):
    user = User(name=name, email=email, role=role)
    user.password = password
    _db.session.add(user)
    _db.session.commit()
    return user


@pytest.fixture
def customer(db):
    return make_user("Amina Wanjiru", "amina@test.dev", ROLE_CUSTOMER)


@pytest.fixture
def other_customer(db):
    return make_user("Brian Otieno", "brian@test.dev", ROLE_CUSTOMER)


@pytest.fixture
def courier(db):
    return make_user("Peter Kamau", "peter@test.dev", ROLE_COURIER)


@pytest.fixture
def admin(db):
    return make_user("Ops Admin", "admin@test.dev", ROLE_ADMIN)


def auth_headers(client, email, password="password123"):
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    return {"Authorization": f"Bearer {response.get_json()['access_token']}"}


@pytest.fixture
def as_customer(client, customer):
    return auth_headers(client, customer.email)


@pytest.fixture
def as_other_customer(client, other_customer):
    return auth_headers(client, other_customer.email)


@pytest.fixture
def as_courier(client, courier):
    return auth_headers(client, courier.email)


@pytest.fixture
def as_admin(client, admin):
    return auth_headers(client, admin.email)


ORDER_PAYLOAD = {
    "pickup_address": "Sarit Centre, Westlands",
    "pickup_lat": -1.2609,
    "pickup_lng": 36.8027,
    "destination_address": "Karen Shopping Centre",
    "destination_lat": -1.3193,
    "destination_lng": 36.7085,
    "weight_category": "standard",
    "weight_kg": 3.5,
    "recipient_name": "Joyce Muthoni",
    "recipient_phone": "0733111222",
}


@pytest.fixture
def order_payload():
    return dict(ORDER_PAYLOAD)


@pytest.fixture
def created_order(client, as_customer, order_payload):
    response = client.post("/api/orders", headers=as_customer, json=order_payload)
    return response.get_json()["order"]
