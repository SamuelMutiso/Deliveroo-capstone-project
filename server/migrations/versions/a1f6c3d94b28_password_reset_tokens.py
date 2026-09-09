"""password reset tokens

Revision ID: a1f6c3d94b28
Revises: e83c9d5f21a7
"""

import sqlalchemy as sa
from alembic import op

revision = "a1f6c3d94b28"
down_revision = "e83c9d5f21a7"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("password_reset_tokens", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_password_reset_tokens_user_id"), ["user_id"], unique=False
        )
        batch_op.create_index(
            batch_op.f("ix_password_reset_tokens_token_hash"), ["token_hash"], unique=True
        )


def downgrade():
    with op.batch_alter_table("password_reset_tokens", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_password_reset_tokens_token_hash"))
        batch_op.drop_index(batch_op.f("ix_password_reset_tokens_user_id"))
    op.drop_table("password_reset_tokens")
