"""Converts local-currency salaries to USD at the fixed exchange rates (decision 4)."""

from collections.abc import Mapping
from decimal import Decimal

from app.constants.currency_constants import Currency
from app.constants.employee_constants import COUNTRY_CURRENCIES, Country


def currency_of(country: str) -> Currency:
    """The currency a salary in this country is stored in."""
    return COUNTRY_CURRENCIES[Country(country)]


class CurrencyConverter:
    def __init__(self, exchange_rates: Mapping[Currency, Decimal]) -> None:
        # Units of each currency per US dollar, checked for every currency by Settings.
        self.exchange_rates = exchange_rates

    def units_per_usd(self, country: str) -> Decimal:
        return self.exchange_rates[currency_of(country)]

    def to_usd(self, amount: Decimal, country: str) -> Decimal:
        """Exact, not rounded: callers round once, at the end (decision 19)."""
        return amount / self.units_per_usd(country)
