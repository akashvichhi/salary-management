from pathlib import Path

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import Engine, inspect

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
    ("salary",),
    ("country", "job_title"),
}


@pytest.fixture
def migrated_engine(tmp_path: Path) -> Engine:
    database_url = f"sqlite:///{tmp_path / 'migrated.db'}"
    config = Config(str(ALEMBIC_INI))
    config.set_main_option("sqlalchemy.url", database_url)
    command.upgrade(config, "head")
    return create_database_engine(database_url)


def test_upgrade_head_creates_every_employee_index(migrated_engine: Engine) -> None:
    inspector = inspect(migrated_engine)
    indexes = inspector.get_indexes(EMPLOYEES_TABLE)

    indexed_columns = {tuple(index["column_names"]) for index in indexes}
    unique_columns = {tuple(index["column_names"]) for index in indexes if index["unique"]}
    assert indexed_columns >= EXPECTED_INDEXED_COLUMNS
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
