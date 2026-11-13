from decimal import Decimal

from app.constants.currency_constants import Currency
from app.constants.employee_constants import COUNTRY_CURRENCIES, Country
from app.core.currency_converter import CurrencyConverter, currency_of
from tests.factories import TEST_EXCHANGE_RATES


def test_every_country_pays_in_one_currency() -> None:
    assert set(COUNTRY_CURRENCIES) == set(Country)


def test_currency_of_a_country_code() -> None:
    assert currency_of("IN") is Currency.INR
    assert currency_of("FR") is currency_of("DE") is Currency.EUR


def test_to_usd_divides_by_the_units_per_usd_without_rounding() -> None:
    converter = CurrencyConverter(TEST_EXCHANGE_RATES)

    assert converter.to_usd(Decimal("8000.00"), "IN") == Decimal("100")
    # 1 USD = 80 INR, so 1 rupee is 0.0125 USD: not rounded to the cent here.
    assert converter.to_usd(Decimal("1.00"), "IN") == Decimal("0.0125")


def test_to_usd_keeps_usd_amounts_as_they_are() -> None:
    converter = CurrencyConverter(TEST_EXCHANGE_RATES)

    assert converter.to_usd(Decimal("85000.10"), "US") == Decimal("85000.10")


def test_units_per_usd_for_a_country_follows_its_currency() -> None:
    converter = CurrencyConverter(TEST_EXCHANGE_RATES)

    assert converter.units_per_usd(Country.FRANCE) == TEST_EXCHANGE_RATES[Currency.EUR]
