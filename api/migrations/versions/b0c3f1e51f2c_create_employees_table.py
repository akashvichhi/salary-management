"""create employees table

Revision ID: b0c3f1e51f2c
Revises:
Create Date: 2026-11-03 20:56:18.953734

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b0c3f1e51f2c"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "employees",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("job_title", sa.String(), nullable=False),
        sa.Column("department", sa.String(), nullable=False),
        sa.Column("country", sa.String(length=2), nullable=False),
        sa.Column("salary", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("hire_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("employees", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_employees_country"), ["country"], unique=False)
        batch_op.create_index(
            "ix_employees_country_job_title", ["country", "job_title"], unique=False
        )
        batch_op.create_index(batch_op.f("ix_employees_department"), ["department"], unique=False)
        batch_op.create_index(batch_op.f("ix_employees_email"), ["email"], unique=True)
        batch_op.create_index(batch_op.f("ix_employees_job_title"), ["job_title"], unique=False)
        batch_op.create_index(batch_op.f("ix_employees_salary"), ["salary"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("employees", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_employees_salary"))
        batch_op.drop_index(batch_op.f("ix_employees_job_title"))
        batch_op.drop_index(batch_op.f("ix_employees_email"))
        batch_op.drop_index(batch_op.f("ix_employees_department"))
        batch_op.drop_index("ix_employees_country_job_title")
        batch_op.drop_index(batch_op.f("ix_employees_country"))

    op.drop_table("employees")
