"""delivery ratings and proof of delivery

Revision ID: c3f8a52e17d9
Revises: b7c4e2a91d55
"""

import sqlalchemy as sa
from alembic import op

revision = "c3f8a52e17d9"
down_revision = "b7c4e2a91d55"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("orders") as batch:
        batch.add_column(sa.Column("received_by", sa.String(length=120), nullable=True))
        batch.add_column(sa.Column("rating", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("rating_comment", sa.String(length=400), nullable=True))
        batch.add_column(sa.Column("rated_at", sa.DateTime(), nullable=True))


def downgrade():
    with op.batch_alter_table("orders") as batch:
        batch.drop_column("rated_at")
        batch.drop_column("rating_comment")
        batch.drop_column("rating")
        batch.drop_column("received_by")
