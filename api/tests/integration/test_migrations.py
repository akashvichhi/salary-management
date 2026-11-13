from decimal import Decimal
from pathlib import Path

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import Engine, inspect, text

from app.core.database import create_database_engine
from app.models.base_model import Base

API_ROOT = Path(__file__).resolve().parents[2]
ALEMBIC_INI = API_ROOT / "alembic.ini"
EMPLOYEES_TABLE = "employees"
EXPECTED_INDEXED_COLUMNS = {
    ("full_name",),
    ("hire_date",),
    ("country",),
    ("job_title",),
    ("department",),
    ("country", "job_title"),
}
# The revision before salaries moved to local currency, when every salary was USD.
USD_SALARIES_REVISION = "d3e8f4a1b6c9"


def alembic_config(database_url: str) -> Config:
    config = Config(str(ALEMBIC_INI))
    config.set_main_option("sqlalchemy.url", database_url)
    return config


@pytest.fixture
def migrated_engine(tmp_path: Path) -> Engine:
    database_url = f"sqlite:///{tmp_path / 'migrated.db'}"
    command.upgrade(alembic_config(database_url), "head")
    return create_database_engine(database_url)


def test_upgrade_head_creates_every_employee_index(migrated_engine: Engine) -> None:
    inspector = inspect(migrated_engine)
    indexes = inspector.get_indexes(EMPLOYEES_TABLE)

    indexed_columns = {tuple(index["column_names"]) for index in indexes}
    unique_columns = {tuple(index["column_names"]) for index in indexes if index["unique"]}
    assert indexed_columns >= EXPECTED_INDEXED_COLUMNS
    # The salary sort compares USD values, an expression no plain column index can serve.
    assert ("salary",) not in indexed_columns
    assert ("email",) in unique_columns
    migrated_engine.dispose()


def test_migrations_match_the_models(migrated_engine: Engine) -> None:
    with migrated_engine.connect() as connection:
        differences = compare_metadata(MigrationContext.configure(connection), Base.metadata)

    assert differences == []
    migrated_engine.dispose()


def test_upgrade_head_creates_the_users_and_sessions_tables(migrated_engine: Engine) -> None:
    inspector = inspect(migrated_engine)

    def unique_columns(table: str) -> set[tuple[str | None, ...]]:
        indexes = inspector.get_indexes(table)
        return {tuple(index["column_names"]) for index in indexes if index["unique"]}

    assert ("email",) in unique_columns("users")
    assert ("token_hash",) in unique_columns("sessions")
    [user_key] = inspector.get_foreign_keys("sessions")
    assert user_key["referred_table"] == "users"
    # Deleting a user ends their sessions.
    assert user_key["options"]["ondelete"] == "CASCADE"
    migrated_engine.dispose()


def salaries_by_country(engine: Engine) -> dict[str, Decimal]:
    with engine.connect() as connection:
        rows = connection.execute(text("SELECT country, salary FROM employees ORDER BY country"))
        return {country: Decimal(str(salary)) for country, salary in rows}


def test_upgrade_converts_usd_salaries_to_local_currency_and_downgrade_restores_them(
    tmp_path: Path,
) -> None:
    database_url = f"sqlite:///{tmp_path / 'usd.db'}"
    config = alembic_config(database_url)
    command.upgrade(config, USD_SALARIES_REVISION)
    engine = create_database_engine(database_url)
    with engine.begin() as connection:
        for country, email in [("IN", "a@acme.com"), ("US", "b@acme.com")]:
            connection.execute(
                text(
                    "INSERT INTO employees (full_name, email, job_title, department, country,"
                    " salary, hire_date, is_active, created_at, updated_at) VALUES ('A', :email,"
                    " 'Accountant', 'Finance', :country, 10000.00, '2024-01-01', 1,"
                    " '2024-01-01 00:00:00', '2024-01-01 00:00:00')"
                ),
                {"email": email, "country": country},
            )

    command.upgrade(config, "head")
    # The rates frozen in the migration: 94.16 INR to the dollar.
    assert salaries_by_country(engine) == {"IN": Decimal("941600.0"), "US": Decimal("10000.0")}

    command.downgrade(config, USD_SALARIES_REVISION)
    assert salaries_by_country(engine) == {"IN": Decimal("10000.0"), "US": Decimal("10000.0")}
    engine.dispose()
