from marshmallow import Schema, fields


class AuditEventSchema(Schema):
    id = fields.Int(dump_only=True)
    actor_name = fields.Str(dump_only=True)
    actor_role = fields.Str(dump_only=True)
    action = fields.Str(dump_only=True)
    subject_type = fields.Str(dump_only=True)
    subject_id = fields.Str(dump_only=True)
    summary = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)


audit_event_schema = AuditEventSchema()
