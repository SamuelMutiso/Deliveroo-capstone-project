from flask import current_app
from marshmallow import ValidationError


def bounds():
    config = current_app.config
    return {
        "name": config.get("SERVICE_AREA_NAME", "Nairobi County"),
        "south": float(config.get("SERVICE_AREA_SOUTH")),
        "north": float(config.get("SERVICE_AREA_NORTH")),
        "west": float(config.get("SERVICE_AREA_WEST")),
        "east": float(config.get("SERVICE_AREA_EAST")),
    }


def contains(lat, lng):
    if lat is None or lng is None:
        return False
    box = bounds()
    return box["south"] <= lat <= box["north"] and box["west"] <= lng <= box["east"]


def viewbox():
    """The box Nominatim wants, as west,north,east,south."""
    box = bounds()
    return f"{box['west']},{box['north']},{box['east']},{box['south']}"


def ensure_inside(data, pairs):
    """Refuse coordinates outside the service area, whatever the browser allowed through."""
    errors = {}
    area = bounds()["name"]

    for lat_field, lng_field, label in pairs:
        lat = data.get(lat_field)
        lng = data.get(lng_field)
        if lat is None or lng is None:
            continue
        if not contains(lat, lng):
            errors[lat_field] = [f"{label} must be inside {area}. We do not deliver beyond it yet."]

    if errors:
        raise ValidationError(errors)
