import pytest

from app.core.config import DEFAULT_DATABASE_URL, Settings


def test_database_url_defaults_to_local_sqlite_file(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)

    settings = Settings(_env_file=None)

    assert settings.database_url == DEFAULT_DATABASE_URL


def test_database_url_is_read_from_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./other.db")

    settings = Settings(_env_file=None)

    assert settings.database_url == "sqlite:///./other.db"
