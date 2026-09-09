from datetime import timezone

from marshmallow import fields


def as_utc(value):
    """Attach UTC to a stamp we stored naive, so nobody downstream has to guess."""
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def to_iso(value):
    stamp = as_utc(value)
    return stamp.isoformat() if stamp else None


class UTCDateTime(fields.DateTime):
    """Every stamp leaves the API marked UTC.

    We store naive UTC. Sent without a marker, a browser reads it as local time and
    every timestamp is wrong by the reader's offset — three hours, in Nairobi.
    """

    def _serialize(self, value, attr, obj, **kwargs):
        return super()._serialize(as_utc(value), attr, obj, **kwargs)
