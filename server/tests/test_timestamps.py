from datetime import datetime, timezone

from app.utils.timestamps import as_utc, to_iso


def test_a_naive_stamp_is_marked_utc():
    marked = as_utc(datetime(2026, 9, 7, 15, 25))

    assert marked.tzinfo is timezone.utc
    assert marked.hour == 15, "marking the zone must not shift the clock"


def test_an_already_aware_stamp_is_left_alone():
    aware = datetime(2026, 9, 7, 15, 25, tzinfo=timezone.utc)

    assert as_utc(aware) is aware


def test_nothing_stays_nothing():
    assert as_utc(None) is None
    assert to_iso(None) is None


def test_the_iso_string_carries_a_zone():
    stamp = to_iso(datetime(2026, 9, 7, 15, 25))

    assert stamp.endswith("+00:00"), f"a browser would read {stamp} as local time"


def test_an_order_leaves_the_api_with_zoned_stamps(client, created_order):
    """Without a zone marker every time is out by the reader's offset."""
    assert created_order["created_at"].endswith("+00:00")


def test_public_tracking_stamps_carry_a_zone(client, created_order):
    parcel = client.get(
        f"/api/public/track/{created_order['tracking_code']}"
    ).get_json()["parcel"]

    assert parcel["created_at"].endswith("+00:00")


def test_tracking_history_stamps_carry_a_zone(client, as_customer, created_order):
    order = client.get(f"/api/orders/{created_order['id']}", headers=as_customer).get_json()[
        "order"
    ]

    assert order["events"][0]["created_at"].endswith("+00:00")
