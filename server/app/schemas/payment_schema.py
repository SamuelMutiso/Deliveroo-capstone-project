from marshmallow import Schema, fields, validate

from ..utils.phone import PhoneField
from ..utils.timestamps import UTCDateTime


class PaymentSchema(Schema):
    id = fields.Int(dump_only=True)
    order_id = fields.Int(dump_only=True)
    amount_kes = fields.Float(dump_only=True)
    method = fields.Str(dump_only=True)
    status = fields.Str(dump_only=True)
    phone = fields.Str(dump_only=True)
    mpesa_receipt = fields.Str(dump_only=True, allow_none=True)
    result_description = fields.Str(dump_only=True, allow_none=True)
    created_at = UTCDateTime(dump_only=True)
    paid_at = UTCDateTime(dump_only=True, allow_none=True)


class CheckoutSchema(Schema):
    phone = PhoneField(required=True)


payment_schema = PaymentSchema()
checkout_schema = CheckoutSchema()
