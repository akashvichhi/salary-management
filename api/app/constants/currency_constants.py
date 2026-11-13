"""Salaries are stored in each country's local currency; figures across countries are converted to
USD at fixed exchange rates (decision 4)."""

from decimal import Decimal
from enum import StrEnum


class Currency(StrEnum):
    """ISO 4217 codes, each with 2 decimal places, as the Numeric(12, 2) salary column needs."""

    AED = "AED"
    AUD = "AUD"
    CAD = "CAD"
    EUR = "EUR"
    GBP = "GBP"
    INR = "INR"
    SGD = "SGD"
    USD = "USD"


# Units of each currency that one US dollar buys: mid-market rates of 13 Nov 2026 (SGD: 10 Nov,
# the latest published). Fixed, not a live feed; override them with the EXCHANGE_RATES
# environment variable (core/config.py).
DEFAULT_EXCHANGE_RATES: dict[Currency, Decimal] = {
    Currency.AED: Decimal("3.6725"),  # pegged to the dollar
    Currency.AUD: Decimal("1.471"),
    Currency.CAD: Decimal("1.426"),
    Currency.EUR: Decimal("0.904"),
    Currency.GBP: Decimal("0.756"),
    Currency.INR: Decimal("94.16"),
    Currency.SGD: Decimal("1.278"),
    Currency.USD: Decimal(1),
}
