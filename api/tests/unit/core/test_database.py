from pathlib import Path

import pytest
from sqlalchemy import Engine, text
from sqlalchemy.exc import OperationalError

from app.core.database import create_database_engine

CONNECTIONS_TO_CHECK = 2


@pytest.fixture
def file_engine(tmp_path: Path) -> Engine:
    # WAL needs a real file: an in-memory database always reports "memory".
    return create_database_engine(f"sqlite:///{tmp_path / 'test.db'}")


def read_pragma(engine: Engine, pragma: str) -> list[object]:
    values = []
    for _ in range(CONNECTIONS_TO_CHECK):
        with engine.connect() as connection:
            values.append(connection.execute(text(f"PRAGMA {pragma}")).scalar())
        engine.dispose()
    return values


def test_every_connection_enables_foreign_keys(file_engine: Engine) -> None:
    assert read_pragma(file_engine, "foreign_keys") == [1] * CONNECTIONS_TO_CHECK


def test_every_connection_uses_wal_journal_mode(file_engine: Engine) -> None:
    assert read_pragma(file_engine, "journal_mode") == ["wal"] * CONNECTIONS_TO_CHECK


def test_database_errors_never_carry_the_query_values() -> None:
    engine = create_database_engine("sqlite://")

    with engine.connect() as connection, pytest.raises(OperationalError) as error:
        connection.execute(text("SELECT :full_name FROM missing_table"), {"full_name": "Asha Rao"})
    engine.dispose()

    # Error messages end up in logs, which must never hold names, emails or salaries.
    assert "Asha Rao" not in str(error.value)
