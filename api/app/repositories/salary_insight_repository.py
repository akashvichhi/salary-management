from decimal import Decimal
from typing import NamedTuple

from sqlalchemy import ColumnElement, func, select
from sqlalchemy.orm import InstrumentedAttribute, Session

from app.constants.employee_constants import Country
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


class SalaryInsightRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def salary_stats_by_country(self) -> list[SalaryStats]:
        return self._salary_stats(EmployeeModel.country)

    def salary_stats_by_job_title(self, country: Country) -> list[SalaryStats]:
        return self._salary_stats(EmployeeModel.job_title, EmployeeModel.country == country)

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
                func.sum(EmployeeModel.salary),
            )
            .where(is_active_employee(), *conditions)
            .group_by(group_column)
            .order_by(group_column)
        )
        return [SalaryStats(*row) for row in self.session.execute(query)]
