"""rider availability, contact email and courier applications

Revision ID: d72f4a1c8b55
Revises: c41b7e2a9d30
"""

import sqlalchemy as sa
from alembic import op

revision = "d72f4a1c8b55"
down_revision = "c41b7e2a9d30"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("contact_email", sa.String(length=180), nullable=True))
        batch.add_column(
            sa.Column("is_available", sa.Boolean(), nullable=False, server_default=sa.false())
        )

    op.create_table(
        "courier_applications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("applicant_id", sa.Integer(), nullable=False),
        sa.Column("courier_id", sa.Integer(), nullable=True),
        sa.Column("reviewed_by_id", sa.Integer(), nullable=True),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("phone", sa.String(length=24), nullable=False),
        sa.Column("licence_number", sa.String(length=40), nullable=False),
        sa.Column("vehicle_type", sa.String(length=20), nullable=False),
        sa.Column("vehicle_ownership", sa.String(length=20), nullable=False),
        sa.Column("vehicle_registration", sa.String(length=40), nullable=True),
        sa.Column("vehicle_photo_url", sa.Text(), nullable=True),
        sa.Column("profile_photo_url", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("review_note", sa.String(length=400), nullable=True),
        sa.Column("company_email", sa.String(length=180), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["applicant_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["courier_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["reviewed_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_courier_applications_applicant_id", "courier_applications", ["applicant_id"]
    )
    op.create_index("ix_courier_applications_status", "courier_applications", ["status"])
    op.create_index("ix_courier_applications_created_at", "courier_applications", ["created_at"])


def downgrade():
    op.drop_index("ix_courier_applications_created_at", table_name="courier_applications")
    op.drop_index("ix_courier_applications_status", table_name="courier_applications")
    op.drop_index("ix_courier_applications_applicant_id", table_name="courier_applications")
    op.drop_table("courier_applications")

    with op.batch_alter_table("users") as batch:
        batch.drop_column("is_available")
        batch.drop_column("contact_email")
