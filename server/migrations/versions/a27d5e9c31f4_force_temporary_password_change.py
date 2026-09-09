"""make a rider replace the temporary password before doing anything else

Revision ID: a27d5e9c31f4
Revises: f19c4a7b52e8
"""

import sqlalchemy as sa
from alembic import op

revision = "a27d5e9c31f4"
down_revision = "f19c4a7b52e8"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users") as batch:
        batch.add_column(
            sa.Column(
                "must_change_password",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            )
        )


def downgrade():
    with op.batch_alter_table("users") as batch:
        batch.drop_column("must_change_password")
