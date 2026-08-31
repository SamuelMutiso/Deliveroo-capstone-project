from marshmallow import Schema, fields, validate

from ..constants import ORDER_STATUSES, WEIGHT_CATEGORIES
from .tracking_schema import TrackingEventSchema
from .user_schema import UserSummarySchema

LAT = validate.Range(min=-90, max=90, error="Latitude must be between -90 and 90")
LNG = validate.Range(min=-180, max=180, error="Longitude must be between -180 and 180")


class OrderSchema(Schema):
    id = fields.Int(dump_only=True)
    tracking_code = fields.Str(dump_only=True)
    status = fields.Str(dump_only=True)

    pickup_address = fields.Str(dump_only=True)
    pickup_lat = fields.Float(dump_only=True)
    pickup_lng = fields.Float(dump_only=True)

    destination_address = fields.Str(dump_only=True)
    destination_lat = fields.Float(dump_only=True)
    destination_lng = fields.Float(dump_only=True)

    current_lat = fields.Float(dump_only=True)
    current_lng = fields.Float(dump_only=True)

    weight_category = fields.Str(dump_only=True)
    weight_kg = fields.Float(dump_only=True)
    distance_km = fields.Float(dump_only=True)
    duration_min = fields.Int(dump_only=True)
    route_polyline = fields.Str(dump_only=True)

    price_kes = fields.Float(dump_only=True)
    price_breakdown = fields.Raw(dump_only=True)

    recipient_name = fields.Str(dump_only=True)
    recipient_phone = fields.Str(dump_only=True)
    recipient_email = fields.Str(dump_only=True, allow_none=True)
    notes = fields.Str(dump_only=True)

    is_editable = fields.Bool(dump_only=True)
    is_cancellable = fields.Bool(dump_only=True)

    received_by = fields.Str(dump_only=True, allow_none=True)
    rating = fields.Int(dump_only=True, allow_none=True)
    rating_comment = fields.Str(dump_only=True, allow_none=True)
    rated_at = fields.DateTime(dump_only=True, allow_none=True)

    customer = fields.Nested(UserSummarySchema, dump_only=True)
    courier = fields.Nested(UserSummarySchema, dump_only=True, allow_none=True)
    payment_status = fields.Method("resolve_payment_status", dump_only=True)

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    picked_up_at = fields.DateTime(dump_only=True)
    delivered_at = fields.DateTime(dump_only=True)
    cancelled_at = fields.DateTime(dump_only=True)

    def resolve_payment_status(self, order):
        return order.payment.status if order.payment else "unpaid"


class OrderDetailSchema(OrderSchema):
    events = fields.List(fields.Nested(TrackingEventSchema), dump_only=True)


class OrderCreateSchema(Schema):
    pickup_address = fields.Str(required=True, validate=validate.Length(min=4, max=255))
    pickup_lat = fields.Float(required=True, validate=LAT)
    pickup_lng = fields.Float(required=True, validate=LNG)

    destination_address = fields.Str(required=True, validate=validate.Length(min=4, max=255))
    destination_lat = fields.Float(required=True, validate=LAT)
    destination_lng = fields.Float(required=True, validate=LNG)

    weight_category = fields.Str(required=True, validate=validate.OneOf(list(WEIGHT_CATEGORIES)))
    weight_kg = fields.Float(load_default=None, allow_none=True, validate=validate.Range(min=0.1, max=50))

    recipient_name = fields.Str(required=True, validate=validate.Length(min=2, max=120))
    recipient_phone = fields.Str(required=True, validate=validate.Length(min=7, max=24))
    recipient_email = fields.Email(load_default=None, allow_none=True)
    notes = fields.Str(load_default=None, allow_none=True, validate=validate.Length(max=400))


class DestinationUpdateSchema(Schema):
    destination_address = fields.Str(required=True, validate=validate.Length(min=4, max=255))
    destination_lat = fields.Float(required=True, validate=LAT)
    destination_lng = fields.Float(required=True, validate=LNG)


class LocationUpdateSchema(Schema):
    lat = fields.Float(required=True, validate=LAT)
    lng = fields.Float(required=True, validate=LNG)
    note = fields.Str(load_default=None, allow_none=True, validate=validate.Length(max=255))


class StatusUpdateSchema(Schema):
    status = fields.Str(required=True, validate=validate.OneOf(list(ORDER_STATUSES)))
    note = fields.Str(load_default=None, allow_none=True, validate=validate.Length(max=255))
    received_by = fields.Str(
        load_default=None, allow_none=True, validate=validate.Length(max=120)
    )


class RatingSchema(Schema):
    rating = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    comment = fields.Str(load_default=None, allow_none=True, validate=validate.Length(max=400))


class AssignCourierSchema(Schema):
    courier_id = fields.Int(required=True)


class QuoteSchema(Schema):
    pickup_lat = fields.Float(required=True, validate=LAT)
    pickup_lng = fields.Float(required=True, validate=LNG)
    destination_lat = fields.Float(required=True, validate=LAT)
    destination_lng = fields.Float(required=True, validate=LNG)
    weight_category = fields.Str(required=True, validate=validate.OneOf(list(WEIGHT_CATEGORIES)))
    weight_kg = fields.Float(load_default=None, allow_none=True, validate=validate.Range(min=0.1, max=50))


order_schema = OrderSchema()
order_detail_schema = OrderDetailSchema()
order_create_schema = OrderCreateSchema()
destination_update_schema = DestinationUpdateSchema()
location_update_schema = LocationUpdateSchema()
status_update_schema = StatusUpdateSchema()
assign_courier_schema = AssignCourierSchema()
quote_schema = QuoteSchema()

rating_schema = RatingSchema()
