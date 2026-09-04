from marshmallow import Schema, fields


class NotificationSchema(Schema):
    id = fields.Int(dump_only=True)
    event = fields.Str(dump_only=True)
    title = fields.Str(dump_only=True)
    body = fields.Str(dump_only=True)
    order_id = fields.Int(dump_only=True, allow_none=True)
    is_read = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    tracking_code = fields.Method("resolve_tracking_code", dump_only=True)

    def resolve_tracking_code(self, notification):
        if notification.order is None:
            return None
        return notification.order.tracking_code


notification_schema = NotificationSchema()
