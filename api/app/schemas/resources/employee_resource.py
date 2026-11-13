from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, computed_field

from app.constants.currency_constants import Currency
from app.core.currency_converter import currency_of
from app.schemas.common.money_schema import Money


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

    # Follows from the country, so it is never stored and can't disagree with it (decision 4).
    @computed_field  # type: ignore[prop-decorator]
    @property
    def currency(self) -> Currency:
        return currency_of(self.country)
