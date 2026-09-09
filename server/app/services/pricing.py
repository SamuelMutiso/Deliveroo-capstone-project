from flask import current_app

from ..constants import WEIGHT_CATEGORIES
from ..utils.errors import ApiError

SURGE_DISTANCE_KM = 25
SURGE_RATE = 0.12


def category_or_raise(category):
    tier = WEIGHT_CATEGORIES.get(category)
    if tier is None:
        raise ApiError(f"Unknown weight category '{category}'")
    return tier


def quote(distance_km, category, weight_kg=None):
    tier = category_or_raise(category)
    if weight_kg is not None and weight_kg > tier["max_kg"]:
        raise ApiError(
            f"{weight_kg}kg exceeds the {tier['label']} limit of {tier['max_kg']}kg",
            status_code=422,
        )

    base = float(tier.get("base_kes") or current_app.config["BASE_RATE_KES"])
    per_km = float(current_app.config["PRICE_PER_KM_KES"])
    distance_km = max(round(float(distance_km), 2), 0.0)

    distance_charge = round(distance_km * per_km, 2)
    subtotal = base + distance_charge
    weight_charge = round(subtotal * (tier["multiplier"] - 1), 2)
    handling = float(tier["handling_kes"])

    long_haul = 0.0
    if distance_km > SURGE_DISTANCE_KM:
        long_haul = round((subtotal + weight_charge) * SURGE_RATE, 2)

    total = base + distance_charge + weight_charge + handling + long_haul
    total = round(total / 10) * 10

    return {
        "currency": "KES",
        "distance_km": distance_km,
        "category": category,
        "category_label": tier["label"],
        "lines": [
            {"label": "Base fare", "amount": round(base, 2)},
            {"label": f"Distance ({distance_km} km)", "amount": distance_charge},
            {"label": f"{tier['label']} handling multiplier", "amount": weight_charge},
            {"label": "Handling fee", "amount": handling},
        ]
        + ([{"label": "Long haul surcharge", "amount": long_haul}] if long_haul else []),
        "total": float(total),
    }


def category_catalogue():
    return [
        {
            "value": key,
            "label": tier["label"],
            "description": tier["description"],
            "max_kg": tier["max_kg"],
            "multiplier": tier["multiplier"],
            "handling_kes": tier["handling_kes"],
        }
        for key, tier in WEIGHT_CATEGORIES.items()
    ]