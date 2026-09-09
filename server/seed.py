import base64
import os
import random
from datetime import timedelta

from app import create_app
from app.constants import (
    PAYMENT_PAID,
    ROLE_ADMIN,
    ROLE_COURIER,
    ROLE_CUSTOMER,
    STATUS_CANCELLED,
    STATUS_DELIVERED,
    STATUS_IN_TRANSIT,
    STATUS_PENDING,
    STATUS_PICKED_UP,
)
from app.extensions import db
from app.utils.clock import utcnow
from app.models import Order, Payment, TrackingEvent, User, generate_tracking_code
from app.services import maps, pricing

PLACES = [
    ("Sarit Centre, Westlands", -1.2609, 36.8027),
    ("Two Rivers Mall, Ruaka", -1.2131, 36.8005),
    ("The Junction Mall, Ngong Road", -1.2986, 36.7645),
    ("Garden City Mall, Thika Road", -1.2331, 36.8776),
    ("Village Market, Gigiri", -1.2286, 36.8039),
    ("Nairobi CBD, Kenyatta Avenue", -1.2841, 36.8221),
    ("Karen Shopping Centre", -1.3193, 36.7085),
    ("Imaanni House, Kilimani", -1.2921, 36.7833),
    ("Syokimau Station", -1.3736, 36.9385),
    ("JKIA Cargo Terminal", -1.3192, 36.9278),
    ("Buruburu Phase 4", -1.2872, 36.8759),
    ("Kikuyu Town", -1.2464, 36.6636),
]

CUSTOMERS = [
    ("Amina Wanjiru", "amina@deliveroo.co.ke", "0712345601"),
    ("Brian Otieno", "brian@deliveroo.co.ke", "0712345602"),
    ("Cynthia Mwikali", "cynthia@deliveroo.co.ke", "0712345603"),
    ("Dennis Kiprotich", "dennis@deliveroo.co.ke", "0712345604"),
    ("Faith Njoki", "faith@deliveroo.co.ke", "0712345605"),
    ("George Wekesa", "george@deliveroo.co.ke", "0712345606"),
    ("Hellen Auma", "hellen@deliveroo.co.ke", "0712345607"),
    ("Isaac Muriuki", "isaac@deliveroo.co.ke", "0712345608"),
    ("Janet Chelangat", "janet@deliveroo.co.ke", "0712345609"),
    ("Kevin Odhiambo", "kevin@deliveroo.co.ke", "0712345610"),
]

def rider_photo(bg, skin, kit):
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">'
        f'<rect width="160" height="160" fill="{bg}"/>'
        f'<circle cx="80" cy="64" r="30" fill="{skin}"/>'
        f'<path d="M80 98c-30 0-48 20-52 46h104c-4-26-22-46-52-46z" fill="{kit}"/>'
        f'<path d="M50 60a30 30 0 0 1 60 0v-5a30 30 0 0 0-60 0z" fill="{kit}"/>'
        '</svg>'
    )
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()


COURIER_PHOTOS = [
    rider_photo(bg, skin, kit)
    for bg, skin, kit in [
        ("#0f2b3d", "#c98a5b", "#ffc400"),
        ("#2a1a3d", "#8d5524", "#ffdb47"),
        ("#123528", "#e0ac69", "#eba800"),
        ("#3d1f0f", "#a9713f", "#ffc400"),
        ("#1b2a3d", "#f1c27d", "#ffdb47"),
        ("#2d1230", "#7a4a21", "#eba800"),
    ]
]

COURIERS = [
    ("Peter Kamau", "peter@deliveroo.co.ke", "0722100001", "Motorbike KMFA 221P"),
    ("Grace Achieng", "grace@deliveroo.co.ke", "0722100002", "Motorbike KMEB 907Q"),
    ("Samuel Leteipa", "samuel@deliveroo.co.ke", "0722100003", "Van KDG 442R"),
    ("Joseph Mwangi", "joseph@deliveroo.co.ke", "0722100004", "Motorbike KMCT 118L"),
    ("Mercy Wairimu", "mercy@deliveroo.co.ke", "0722100005", "Motorbike KMDA 553K"),
    ("Ibrahim Hassan", "ibrahim@deliveroo.co.ke", "0722100006", "Van KDH 810S"),
    ("Caroline Adhiambo", "caroline@deliveroo.co.ke", "0722100007", "Motorbike KMFC 274J"),
    ("Daniel Kiptoo", "daniel@deliveroo.co.ke", "0722100008", "Motorbike KMEE 639T"),
    ("Esther Nyambura", "esther@deliveroo.co.ke", "0722100009", "Motorbike KMBG 402V"),
    ("Victor Omollo", "victor@deliveroo.co.ke", "0722100010", "Truck KCX 175W"),
    ("Halima Abdi", "halima@deliveroo.co.ke", "0722100011", "Motorbike KMFD 986B"),
    ("Nelson Mutiso", "nelson@deliveroo.co.ke", "0722100012", "Van KDF 331N"),
    ("Sharon Chebet", "sharon@deliveroo.co.ke", "0722100013", "Motorbike KMEA 720C"),
    ("Anthony Njoroge", "anthony@deliveroo.co.ke", "0722100014", "Motorbike KMCB 508D"),
    ("Beatrice Kilonzo", "beatrice@deliveroo.co.ke", "0722100015", "Bicycle courier, CBD"),
]

CATEGORIES = ["light", "standard", "heavy", "bulk"]
STATUS_PLAN = [
    STATUS_DELIVERED,
    STATUS_DELIVERED,
    STATUS_DELIVERED,
    STATUS_IN_TRANSIT,
    STATUS_IN_TRANSIT,
    STATUS_PICKED_UP,
    STATUS_PENDING,
    STATUS_PENDING,
    STATUS_PENDING,
    STATUS_CANCELLED,
]

STAGE_ORDER = [STATUS_PENDING, STATUS_PICKED_UP, STATUS_IN_TRANSIT, STATUS_DELIVERED]

STAGE_NOTES = {
    STATUS_PENDING: "Order created",
    STATUS_PICKED_UP: "Parcel collected from sender",
    STATUS_IN_TRANSIT: "On the road to destination",
    STATUS_DELIVERED: "Handed to recipient",
    STATUS_CANCELLED: "Cancelled by customer",
}


def make_user(name, email, phone, role, password, vehicle=None):
    user = User(
        name=name, email=email, phone=phone, role=role, vehicle=vehicle, email_verified=True
    )
    user.password = password
    db.session.add(user)
    return user


def interpolate(order, fraction):
    lat = order.pickup_lat + (order.destination_lat - order.pickup_lat) * fraction
    lng = order.pickup_lng + (order.destination_lng - order.pickup_lng) * fraction
    return round(lat, 6), round(lng, 6)


def build_order(customer, courier, status, created_at):
    pickup = random.choice(PLACES)
    destination = random.choice([place for place in PLACES if place != pickup])
    category = random.choice(CATEGORIES)
    max_kg = {"light": 2, "standard": 5, "heavy": 20, "bulk": 50}[category]
    weight = round(random.uniform(0.5, max_kg * 0.9), 1)

    route = maps.estimate_route((pickup[1], pickup[2]), (destination[1], destination[2]))
    breakdown = pricing.quote(route["distance_km"], category, weight)

    order = Order(
        tracking_code=generate_tracking_code(),
        customer_id=customer.id,
        courier_id=courier.id if courier else None,
        pickup_address=pickup[0],
        pickup_lat=pickup[1],
        pickup_lng=pickup[2],
        destination_address=destination[0],
        destination_lat=destination[1],
        destination_lng=destination[2],
        weight_category=category,
        weight_kg=weight,
        distance_km=route["distance_km"],
        duration_min=route["duration_min"],
        route_polyline=route["polyline"],
        price_kes=breakdown["total"],
        price_breakdown=breakdown,
        status=status,
        recipient_name=random.choice(
            ["Joyce Muthoni", "Kevin Barasa", "Mercy Chebet", "Alex Njoroge", "Lydia Akinyi"]
        ),
        recipient_phone=f"07{random.randint(10000000, 99999999)}",
        notes=random.choice([None, "Call on arrival", "Leave at the reception", "Fragile"]),
        created_at=created_at,
    )

    progress = {
        STATUS_PENDING: 0.0,
        STATUS_PICKED_UP: 0.1,
        STATUS_IN_TRANSIT: round(random.uniform(0.35, 0.75), 2),
        STATUS_DELIVERED: 1.0,
        STATUS_CANCELLED: 0.0,
    }[status]
    order.current_lat, order.current_lng = interpolate(order, progress)

    db.session.add(order)
    db.session.flush()

    stages = STAGE_ORDER[: STAGE_ORDER.index(status) + 1] if status in STAGE_ORDER else [STATUS_PENDING]
    if status == STATUS_CANCELLED:
        stages = [STATUS_PENDING, STATUS_CANCELLED]

    for index, stage in enumerate(stages):
        moment = created_at + timedelta(minutes=index * random.randint(25, 90))
        fraction = {
            STATUS_PENDING: 0.0,
            STATUS_PICKED_UP: 0.1,
            STATUS_IN_TRANSIT: progress,
            STATUS_DELIVERED: 1.0,
            STATUS_CANCELLED: 0.0,
        }[stage]
        lat, lng = interpolate(order, fraction)
        event = TrackingEvent(
            order_id=order.id,
            actor_id=(courier.id if courier and stage != STATUS_PENDING else customer.id),
            status=stage,
            note=STAGE_NOTES[stage],
            lat=lat,
            lng=lng,
            created_at=moment,
        )
        db.session.add(event)

        if stage == STATUS_PICKED_UP:
            order.picked_up_at = moment
        elif stage == STATUS_DELIVERED:
            order.delivered_at = moment
        elif stage == STATUS_CANCELLED:
            order.cancelled_at = moment

    if status == STATUS_DELIVERED:
        db.session.add(
            Payment(
                order_id=order.id,
                amount_kes=order.price_kes,
                method="mpesa",
                status=PAYMENT_PAID,
                phone="254712345678",
                mpesa_receipt=f"S{random.randint(100000, 999999)}KE",
                paid_at=order.delivered_at,
            )
        )

    return order


def run():
    app = create_app()
    with app.app_context():
        db.drop_all()
        db.create_all()

        admin = make_user("Ops Admin", "admin@deliveroo.co.ke", "0700000000", ROLE_ADMIN, "admin1234")
        demo_inbox = os.getenv("DEMO_INBOX", "").strip()
        if demo_inbox:
            admin.contact_email = demo_inbox
        couriers = [
            make_user(name, email, phone, ROLE_COURIER, "courier1234", vehicle)
            for name, email, phone, vehicle in COURIERS
        ]
        customers = [
            make_user(name, email, phone, ROLE_CUSTOMER, "customer1234")
            for name, email, phone in CUSTOMERS
        ]
        for index, courier in enumerate(couriers):
            courier.photo_url = COURIER_PHOTOS[index % len(COURIER_PHOTOS)]
            courier.is_available = index % 4 != 3

        db.session.flush()

        for courier in couriers:
            courier.touch_location(
                round(random.uniform(-1.34, -1.21), 6), round(random.uniform(36.70, 36.93), 6)
            )

        random.seed(7)
        now = utcnow()
        created = 0
        for day_offset in range(14):
            for status in random.choices(STATUS_PLAN, k=random.randint(6, 11)):
                customer = random.choice(customers)
                courier = None if status == STATUS_PENDING else random.choice(couriers)
                created_at = now - timedelta(
                    days=day_offset, hours=random.randint(0, 10), minutes=random.randint(0, 59)
                )
                build_order(customer, courier, status, created_at)
                created += 1

        db.session.commit()

        print(f"Seeded {created} orders")
        print("  admin    admin@deliveroo.co.ke / admin1234")
        print("  courier  peter@deliveroo.co.ke / courier1234")
        print("  customer amina@deliveroo.co.ke / customer1234")
        print(f"  users    {User.query.count()}  couriers {len(couriers)}  customers {len(customers)}")
        print(f"  events   {TrackingEvent.query.count()}")


if __name__ == "__main__":
    run()