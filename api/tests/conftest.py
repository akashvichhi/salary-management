from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app

IN_MEMORY_DATABASE_URL = "sqlite://"


@pytest.fixture
def settings() -> Settings:
    return Settings(_env_file=None, database_url=IN_MEMORY_DATABASE_URL)


@pytest.fixture
def client(settings: Settings) -> Iterator[TestClient]:
    with TestClient(create_app(settings)) as test_client:
        yield test_client
