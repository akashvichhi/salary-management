from pydantic import BaseModel

from app.constants.currency_constants import Currency
from app.schemas.common.money_schema import Money

# Amounts named *_usd are converted at the fixed exchange rates; the rest are in `currency`, the
# local currency of the country the row covers (decision 4).


class CountrySalaryInsightResource(BaseModel):
    country: str
    currency: Currency
    headcount: int
    min_salary: Money
    max_salary: Money
    average_salary: Money
    median_salary: Money
    # The one figure comparable across countries.
    average_salary_usd: Money


class JobTitleSalaryInsightResource(BaseModel):
    job_title: str
    currency: Currency
    headcount: int
    average_salary: Money


class DepartmentSalaryInsightResource(BaseModel):
    """A department spans countries, so its average can only be given in one shared currency."""

    department: str
    headcount: int
    average_salary_usd: Money


class CountryPayrollResource(BaseModel):
    country: str
    currency: Currency
    headcount: int
    total_payroll: Money
    total_payroll_usd: Money


class PayrollOverviewResource(BaseModel):
    headcount: int
    total_payroll_usd: Money
    payroll_by_country: list[CountryPayrollResource]
