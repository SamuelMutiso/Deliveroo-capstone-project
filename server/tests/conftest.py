import threading

import pytest

from app import create_app
from app.constants import ROLE_ADMIN, ROLE_COURIER, ROLE_CUSTOMER
from app.extensions import db as _db
from app.extensions import limiter
from app.models import User
from app.resources import payments as payments_resource


def wait_for_background_work(timeout=5.0):
    """A simulated M-Pesa settlement runs on a thread and writes after the test ends.

    Dropping the tables while it is mid-write locks the database, so let it finish first.
    """
    for thread in threading.enumerate():
        if thread is not threading.current_thread():
            thread.join(timeout=timeout)


@pytest.fixture
def app():
    application = create_app("testing")
    with application.app_context():
        _db.create_all()
        yield application
        wait_for_background_work()
        _db.session.remove()
        _db.drop_all()


class InlineThread:
    """Runs the work immediately instead of alongside.

    A simulated settlement writes to the database from a thread. Against SQLite, which
    allows a single writer, that races the test's own transaction and its teardown. The
    threading is a production concern; what a test needs to check is that the settlement
    happens and settles the payment correctly.
    """

    daemon = True

    def __init__(self, target=None, args=(), kwargs=None, **_ignored):
        self._target = target
        self._args = args
        self._kwargs = kwargs or {}

    def start(self):
        if self._target is not None:
            self._target(*self._args, **self._kwargs)

    def join(self, timeout=None):
        return None

    def is_alive(self):
        return False


@pytest.fixture(autouse=True)
def settle_without_racing(monkeypatch):
    """No waiting, and no second writer fighting the test for the database."""
    monkeypatch.setattr(payments_resource, "SIMULATED_SETTLE_SECONDS", 0)
    monkeypatch.setattr(payments_resource, "Thread", InlineThread)


@pytest.fixture(autouse=True)
def quiet_limiter(app):
    """Rate limits are off unless a test switches them on, and never leak between tests."""
    limiter.enabled = False
    limiter.reset()
    yield
    limiter.enabled = False
    limiter.reset()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db(app):
    return _db


def make_user(name, email, role, password="password123"):
    user = User(name=name, email=email, role=role, email_verified=True)
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
