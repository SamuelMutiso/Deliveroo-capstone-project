"""store the issued rider password on the application

Revision ID: e83c9d5f21a7
Revises: d72f4a1c8b55
"""

import sqlalchemy as sa
from alembic import op

revision = "e83c9d5f21a7"
down_revision = "d72f4a1c8b55"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("courier_applications") as batch:
        batch.add_column(sa.Column("temporary_password", sa.String(length=60), nullable=True))


def downgrade():
    with op.batch_alter_table("courier_applications") as batch:
        batch.drop_column("temporary_password")
