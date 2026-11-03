from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.database import create_database_engine, create_session_factory
from app.main import create_app
from app.models.base_model import Base

IN_MEMORY_DATABASE_URL = "sqlite://"


@pytest.fixture
def session() -> Iterator[Session]:
    """A unit-test session on a fresh in-memory database."""
    engine = create_database_engine(IN_MEMORY_DATABASE_URL)
    # Tests only: production schemas come from Alembic migrations.
    Base.metadata.create_all(engine)
    with create_session_factory(engine)() as db_session:
        yield db_session
    engine.dispose()


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    # A file, not memory: the app opens connections from several threads, and each
    # would otherwise get its own empty in-memory database.
    database_url = f"sqlite:///{tmp_path / 'test.db'}"
    engine = create_database_engine(database_url)
    Base.metadata.create_all(engine)
    engine.dispose()
    return Settings(_env_file=None, database_url=database_url)


@pytest.fixture
def client(settings: Settings) -> Iterator[TestClient]:
    with TestClient(create_app(settings)) as test_client:
        yield test_client
