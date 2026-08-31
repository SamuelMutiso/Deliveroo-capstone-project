"""record when the delivery receipt was emailed

Revision ID: d4a91b6f30c2
Revises: c3f8a52e17d9
"""

import sqlalchemy as sa
from alembic import op

revision = "d4a91b6f30c2"
down_revision = "c3f8a52e17d9"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("orders") as batch:
        batch.add_column(sa.Column("receipt_sent_at", sa.DateTime(), nullable=True))


def downgrade():
    with op.batch_alter_table("orders") as batch:
        batch.drop_column("receipt_sent_at")
