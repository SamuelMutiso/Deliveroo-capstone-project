from marshmallow import Schema, fields


class TrackingEventSchema(Schema):
    id = fields.Int(dump_only=True)
    status = fields.Str(dump_only=True)
    note = fields.Str(dump_only=True, allow_none=True)
    lat = fields.Float(dump_only=True, allow_none=True)
    lng = fields.Float(dump_only=True, allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    actor = fields.Method("resolve_actor", dump_only=True)

    def resolve_actor(self, event):
        if event.actor is None:
            return None
        return {"id": event.actor.id, "name": event.actor.name, "role": event.actor.role}


tracking_event_schema = TrackingEventSchema()