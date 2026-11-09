from decimal import Decimal
from typing import NamedTuple

from sqlalchemy import ColumnElement, Integer, cast, func, select
from sqlalchemy.orm import InstrumentedAttribute, Session

from app.constants.employee_constants import Country
from app.core.money import CENTS_PER_UNIT, from_cents
from app.models.employee_model import EmployeeModel
from app.repositories.employee_repository import is_active_employee


class SalaryStats(NamedTuple):
    """One group's aggregates, all computed by SQL GROUP BY."""

    group: str
    headcount: int
    min_salary: Decimal
    max_salary: Decimal
    total_salary: Decimal


class GroupSalary(NamedTuple):
    group: str
    salary: Decimal


# SQLite keeps NUMERIC values as floats, and a float sum of 10,000 large salaries can lose a cent.
# Whole cents are exact integers, so SQL adds those up and the total converts back exactly.
SALARY_IN_CENTS = cast(func.round(EmployeeModel.salary * CENTS_PER_UNIT), Integer)


class SalaryInsightRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def salary_stats_by_country(self) -> list[SalaryStats]:
        return self._salary_stats(EmployeeModel.country)

    def salary_stats_by_job_title(self, country: Country) -> list[SalaryStats]:
        return self._salary_stats(EmployeeModel.job_title, EmployeeModel.country == country)

    def salary_stats_by_department(self) -> list[SalaryStats]:
        return self._salary_stats(EmployeeModel.department)

    def salaries_by_country(self) -> list[GroupSalary]:
        """One column per row, for the median, which SQLite can't compute."""
        query = (
            select(EmployeeModel.country, EmployeeModel.salary)
            .where(is_active_employee())
            .order_by(EmployeeModel.country)
        )
        return [GroupSalary(*row) for row in self.session.execute(query)]

    def _salary_stats(
        self, group_column: InstrumentedAttribute[str], *conditions: ColumnElement[bool]
    ) -> list[SalaryStats]:
        query = (
            select(
                group_column,
                func.count(),
                func.min(EmployeeModel.salary),
                func.max(EmployeeModel.salary),
                func.sum(SALARY_IN_CENTS),
            )
            .where(is_active_employee(), *conditions)
            .group_by(group_column)
            .order_by(group_column)
        )
        return [
            SalaryStats(group, headcount, min_salary, max_salary, from_cents(total_cents))
            for group, headcount, min_salary, max_salary, total_cents in self.session.execute(query)
        ]
