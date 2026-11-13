"""store salaries in local currency

Revision ID: e5a9c2d7f310
Revises: d3e8f4a1b6c9
Create Date: 2026-11-13 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e5a9c2d7f310"
down_revision: str | Sequence[str] | None = "d3e8f4a1b6c9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Units of local currency per US dollar on the day salaries moved from USD to local currency
# (decision 4). Copied, not imported: a migration must convert the same way forever, even after
# the app's default rates change.
UNITS_PER_USD_BY_COUNTRY: dict[str, str] = {
    "AE": "3.6725",
    "AU": "1.471",
    "CA": "1.426",
    "DE": "0.904",
    "FR": "0.904",
    "GB": "0.756",
    "IN": "94.16",
    "NL": "0.904",
    "SG": "1.278",
}

CONVERT_TO_LOCAL = sa.text(
    "UPDATE employees SET salary = ROUND(salary * :rate, 2) WHERE country = :country"
)
CONVERT_TO_USD = sa.text(
    "UPDATE employees SET salary = ROUND(salary / :rate, 2) WHERE country = :country"
)


def convert_salaries(statement: sa.TextClause) -> None:
    for country, rate in UNITS_PER_USD_BY_COUNTRY.items():
        # Bound as text: SQLite reads it as a number in the arithmetic, with no Python float.
        op.execute(statement.bindparams(country=country, rate=rate))


def upgrade() -> None:
    convert_salaries(CONVERT_TO_LOCAL)
    # The salary sort now compares USD values, an expression no column index can serve.
    with op.batch_alter_table("employees", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_employees_salary"))


def downgrade() -> None:
    with op.batch_alter_table("employees", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_employees_salary"), ["salary"], unique=False)
    # Back to USD, rounded to the cent, so an amount can differ from the original by a cent.
    convert_salaries(CONVERT_TO_USD)
