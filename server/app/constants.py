ROLE_CUSTOMER = "customer"
ROLE_COURIER = "courier"
ROLE_ADMIN = "admin"

USER_ROLES = (ROLE_CUSTOMER, ROLE_COURIER, ROLE_ADMIN)

STATUS_PENDING = "pending"
STATUS_PICKED_UP = "picked_up"
STATUS_IN_TRANSIT = "in_transit"
STATUS_DELIVERED = "delivered"
STATUS_CANCELLED = "cancelled"

ORDER_STATUSES = (
    STATUS_PENDING,
    STATUS_PICKED_UP,
    STATUS_IN_TRANSIT,
    STATUS_DELIVERED,
    STATUS_CANCELLED,
)

TERMINAL_STATUSES = (STATUS_DELIVERED, STATUS_CANCELLED)

COURIER_TRANSITIONS = {
    STATUS_PENDING: (STATUS_PICKED_UP,),
    STATUS_PICKED_UP: (STATUS_IN_TRANSIT,),
    STATUS_IN_TRANSIT: (STATUS_DELIVERED,),
    STATUS_DELIVERED: (),
    STATUS_CANCELLED: (),
}

WEIGHT_CATEGORIES = {
    "envelope": {
        "label": "Envelope",
        "description": "Documents, letters, keys and small items",
        "max_kg": 1,
        "multiplier": 1.0,
        "handling_kes": 0,
        "base_kes": 90,
    },
    "light": {
        "label": "Light",
        "description": "Documents and small packets",
        "max_kg": 2,
        "multiplier": 1.0,
        "handling_kes": 0,
    },
    "standard": {
        "label": "Standard",
        "description": "Shoeboxes, electronics, clothing",
        "max_kg": 5,
        "multiplier": 1.35,
        "handling_kes": 60,
    },
    "heavy": {
        "label": "Heavy",
        "description": "Appliances and bulk retail",
        "max_kg": 20,
        "multiplier": 1.9,
        "handling_kes": 180,
    },
    "bulk": {
        "label": "Bulk",
        "description": "Furniture and pallet loads",
        "max_kg": 50,
        "multiplier": 2.6,
        "handling_kes": 420,
    },
}

PAYMENT_PENDING = "pending"
PAYMENT_PROCESSING = "processing"
PAYMENT_PAID = "paid"
PAYMENT_FAILED = "failed"

PAYMENT_STATUSES = (
    PAYMENT_PENDING,
    PAYMENT_PROCESSING,
    PAYMENT_PAID,
    PAYMENT_FAILED,
)

APPLICATION_PENDING = "pending"
APPLICATION_APPROVED = "approved"
APPLICATION_REJECTED = "rejected"

APPLICATION_STATUSES = (APPLICATION_PENDING, APPLICATION_APPROVED, APPLICATION_REJECTED)

VEHICLE_TYPES = (
    ("bicycle", "Bicycle"),
    ("motorbike", "Motorbike"),
    ("car", "Car"),
    ("van", "Van"),
    ("truck", "Truck"),
)

VEHICLE_TYPE_VALUES = tuple(value for value, _label in VEHICLE_TYPES)

VEHICLE_OWNERSHIP = ("own", "company")

RIDER_EMAIL_DOMAIN = "riders.deliveroo.co.ke"
