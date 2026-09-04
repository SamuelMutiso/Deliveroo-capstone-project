import re

from marshmallow import ValidationError, fields

PATTERN = re.compile(r"0[17]\d{8}")
HINT = "Enter a 10 digit number starting 07 or 01, for example 0712345678"


def normalise(raw):
    """Reduce anything a person might type to the 10 digit local form."""
    digits = re.sub(r"[^\d+]", "", raw or "")
    if digits.startswith("+254"):
        return "0" + digits[4:]
    if digits.startswith("254"):
        return "0" + digits[3:]
    if re.fullmatch(r"[17]\d{8}", digits):
        return "0" + digits
    return digits


def is_valid(raw):
    return bool(PATTERN.fullmatch(normalise(raw)))


class PhoneField(fields.Str):
    """A phone number stored the same way whatever format it arrived in."""

    def _deserialize(self, value, attr, data, **kwargs):
        raw = super()._deserialize(value, attr, data, **kwargs)
        cleaned = normalise(raw)
        if not PATTERN.fullmatch(cleaned):
            raise ValidationError(HINT)
        return cleaned
