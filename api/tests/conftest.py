from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.currency_converter import CurrencyConverter
from app.core.database import create_database_engine, create_session_factory
from app.main import create_app
from app.models.base_model import Base
from app.models.user_model import UserModel
from tests.factories import TEST_EXCHANGE_RATES, build_user, login_payload

IN_MEMORY_DATABASE_URL = "sqlite://"
LOGIN_URL = "/api/v1/auth/login"


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
def converter() -> CurrencyConverter:
    return CurrencyConverter(TEST_EXCHANGE_RATES)


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    # A file, not memory: the app opens connections from several threads, and each
    # would otherwise get its own empty in-memory database.
    database_url = f"sqlite:///{tmp_path / 'test.db'}"
    engine = create_database_engine(database_url)
    Base.metadata.create_all(engine)
    engine.dispose()
    # The test client talks plain http, where a Secure cookie would never be sent back.
    return Settings(
        _env_file=None,
        database_url=database_url,
        cookie_secure=False,
        exchange_rates=TEST_EXCHANGE_RATES,
    )


@pytest.fixture
def client(settings: Settings) -> Iterator[TestClient]:
    with TestClient(create_app(settings)) as test_client:
        yield test_client


@pytest.fixture
def hr_manager(settings: Settings) -> UserModel:
    engine = create_database_engine(settings.database_url)
    with create_session_factory(engine)() as db_session:
        user = build_user()
        db_session.add(user)
        db_session.commit()
    engine.dispose()
    return user


@pytest.fixture
def authenticated_client(client: TestClient, hr_manager: UserModel) -> TestClient:
    """A client logged in as the HR manager; its cookie jar carries the session."""
    response = client.post(LOGIN_URL, json=login_payload())
    assert response.status_code == 200, response.text
    return client
