"""add soft delete and sort indexes

Revision ID: 64f6f02de050
Revises: b0c3f1e51f2c
Create Date: 2026-11-03 21:11:09.870022

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "64f6f02de050"
down_revision: str | Sequence[str] | None = "b0c3f1e51f2c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("employees", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False)
        )
        batch_op.drop_index(batch_op.f("ix_employees_email"))
        batch_op.create_index(batch_op.f("ix_employees_full_name"), ["full_name"], unique=False)
        batch_op.create_index(batch_op.f("ix_employees_hire_date"), ["hire_date"], unique=False)
        batch_op.create_index(
            "uq_employees_active_email",
            ["email"],
            unique=True,
            sqlite_where=sa.text("is_active = 1"),
        )


def downgrade() -> None:
    with op.batch_alter_table("employees", schema=None) as batch_op:
        batch_op.drop_index("uq_employees_active_email", sqlite_where=sa.text("is_active = 1"))
        batch_op.drop_index(batch_op.f("ix_employees_hire_date"))
        batch_op.drop_index(batch_op.f("ix_employees_full_name"))
        batch_op.create_index(batch_op.f("ix_employees_email"), ["email"], unique=True)
        batch_op.drop_column("is_active")
