"""Money rules shared by every feature. Money is always a Decimal, never a float."""

from decimal import ROUND_HALF_UP, Decimal

CENT = Decimal("0.01")
CENTS_PER_UNIT = 100
CENT_EXPONENT = -2


def from_cents(cents: int) -> Decimal:
    """A whole number of cents as an exact amount: 8500010 → 85000.10."""
    return Decimal(cents).scaleb(CENT_EXPONENT)


def round_to_cents(amount: Decimal) -> Decimal:
    """Half-up, as people round money by hand (0.005 → 0.01), not banker's rounding."""
    return amount.quantize(CENT, rounding=ROUND_HALF_UP)
