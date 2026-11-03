"""Money rules shared by every feature. Money is always a Decimal, never a float."""

from decimal import ROUND_HALF_UP, Decimal

CENT = Decimal("0.01")


def round_to_cents(amount: Decimal) -> Decimal:
    """Half-up, as people round money by hand (0.005 → 0.01), not banker's rounding."""
    return amount.quantize(CENT, rounding=ROUND_HALF_UP)
