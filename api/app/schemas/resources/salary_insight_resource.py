from pydantic import BaseModel

from app.schemas.common.money_schema import Money


class CountrySalaryInsightResource(BaseModel):
    country: str
    headcount: int
    min_salary: Money
    max_salary: Money
    average_salary: Money
    median_salary: Money
