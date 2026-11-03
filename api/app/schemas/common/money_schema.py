from decimal import Decimal
from typing import Annotated

from pydantic import PlainSerializer

from app.core.money import round_to_cents


def format_money(amount: Decimal) -> str:
    # Always two decimals ("85000.00"), so the frontend formats without parsing floats.
    return str(round_to_cents(amount))


Money = Annotated[Decimal, PlainSerializer(format_money, return_type=str)]
