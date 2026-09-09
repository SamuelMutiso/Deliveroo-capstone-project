"""rider photo and admin-only rider assignment

Revision ID: c41b7e2a9d30
Revises: 9b80ea1fa66f
"""

import sqlalchemy as sa
from alembic import op

revision = "c41b7e2a9d30"
down_revision = "9b80ea1fa66f"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("photo_url", sa.Text(), nullable=True))

    with op.batch_alter_table("orders") as batch:
        batch.drop_column("preferred_courier_id")


def downgrade():
    with op.batch_alter_table("orders") as batch:
        batch.add_column(sa.Column("preferred_courier_id", sa.Integer(), nullable=True))

    with op.batch_alter_table("users") as batch:
        batch.drop_column("photo_url")
