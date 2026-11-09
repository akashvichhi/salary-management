"""sort names ignoring case

Revision ID: d3e8f4a1b6c9
Revises: c7a41e9d2b58
Create Date: 2026-11-10 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d3e8f4a1b6c9"
down_revision: str | Sequence[str] | None = "c7a41e9d2b58"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # SQLite can't change a column's collation in place, so batch mode rebuilds the table,
    # and the name index is rebuilt with the new collation.
    with op.batch_alter_table("employees", schema=None) as batch_op:
        batch_op.alter_column(
            "full_name",
            existing_type=sa.String(),
            type_=sa.String(collation="NOCASE"),
            existing_nullable=False,
        )


def downgrade() -> None:
    with op.batch_alter_table("employees", schema=None) as batch_op:
        batch_op.alter_column(
            "full_name",
            existing_type=sa.String(collation="NOCASE"),
            type_=sa.String(),
            existing_nullable=False,
        )
