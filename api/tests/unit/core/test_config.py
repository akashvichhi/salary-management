import json
from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.constants.currency_constants import DEFAULT_EXCHANGE_RATES, Currency
from app.core.config import DEFAULT_DATABASE_URL, Settings


def test_database_url_defaults_to_local_sqlite_file(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)

    settings = Settings(_env_file=None)

    assert settings.database_url == DEFAULT_DATABASE_URL


def test_database_url_is_read_from_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./other.db")

    settings = Settings(_env_file=None)

    assert settings.database_url == "sqlite:///./other.db"


def test_exchange_rates_default_to_a_rate_for_every_currency(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("EXCHANGE_RATES", raising=False)

    settings = Settings(_env_file=None)

    assert settings.exchange_rates == DEFAULT_EXCHANGE_RATES
    assert set(settings.exchange_rates) == set(Currency)


def test_exchange_rates_are_read_from_environment_as_json(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    rates = {currency.value: "2" for currency in Currency} | {"USD": "1", "INR": "90.25"}
    monkeypatch.setenv("EXCHANGE_RATES", json.dumps(rates))

    settings = Settings(_env_file=None)

    assert settings.exchange_rates[Currency.INR] == Decimal("90.25")


@pytest.mark.parametrize(
    "overrides",
    [
        {Currency.INR: None},  # missing
        {Currency.INR: Decimal(0)},
        {Currency.INR: Decimal("-1")},
        {Currency.USD: Decimal(2)},  # USD is what every rate is quoted against
    ],
)
def test_exchange_rates_must_cover_every_currency_with_a_positive_rate(
    overrides: dict[Currency, Decimal | None],
) -> None:
    rates = {
        currency: rate
        for currency, rate in (DEFAULT_EXCHANGE_RATES | overrides).items()
        if rate is not None
    }

    with pytest.raises(ValidationError):
        Settings(_env_file=None, exchange_rates=rates)
