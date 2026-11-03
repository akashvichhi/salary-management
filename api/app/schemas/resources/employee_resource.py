from datetime import date, datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, PlainSerializer

MONEY_QUANTUM = Decimal("0.01")


def format_money(amount: Decimal) -> str:
    # Always two decimals ("85000.00"), so the frontend formats without parsing floats.
    return str(amount.quantize(MONEY_QUANTUM))


Money = Annotated[Decimal, PlainSerializer(format_money, return_type=str)]


class EmployeeResource(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    job_title: str
    department: str
    country: str
    salary: Money
    hire_date: date
    created_at: datetime
    updated_at: datetime
