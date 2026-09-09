from datetime import datetime, timezone


def utcnow():
    """Naive UTC timestamp, the tz-aware replacement for the deprecated datetime.utcnow()."""
    return datetime.now(timezone.utc).replace(tzinfo=None)