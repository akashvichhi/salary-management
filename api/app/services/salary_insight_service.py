from collections import defaultdict
from decimal import Decimal
from statistics import median

from app.constants.employee_constants import Country
from app.core.money import round_to_cents
from app.repositories.salary_insight_repository import (
    GroupSalary,
    SalaryInsightRepository,
    SalaryStats,
)
from app.schemas.resources.salary_insight_resource import (
    CountryPayrollResource,
    CountrySalaryInsightResource,
    DepartmentSalaryInsightResource,
    JobTitleSalaryInsightResource,
    PayrollOverviewResource,
)


def average_salary(stats: SalaryStats) -> Decimal:
    # From the exact SQL sum, not SQLite's AVG, so no float rounding reaches the result.
    return round_to_cents(stats.total_salary / stats.headcount)


def median_by_group(salaries: list[GroupSalary]) -> dict[str, Decimal]:
    by_group: defaultdict[str, list[Decimal]] = defaultdict(list)
    for row in salaries:
        by_group[row.group].append(row.salary)
    return {group: round_to_cents(median(values)) for group, values in by_group.items()}


class SalaryInsightService:
    def __init__(self, repository: SalaryInsightRepository) -> None:
        self.repository = repository

    def salary_by_country(self) -> list[CountrySalaryInsightResource]:
        medians = median_by_group(self.repository.salaries_by_country())
        return [
            CountrySalaryInsightResource(
                country=stats.group,
                headcount=stats.headcount,
                min_salary=stats.min_salary,
                max_salary=stats.max_salary,
                average_salary=average_salary(stats),
                median_salary=medians[stats.group],
            )
            for stats in self.repository.salary_stats_by_country()
        ]

    def salary_by_job_title(self, country: Country) -> list[JobTitleSalaryInsightResource]:
        return [
            JobTitleSalaryInsightResource(
                job_title=stats.group,
                headcount=stats.headcount,
                average_salary=average_salary(stats),
            )
            for stats in self.repository.salary_stats_by_job_title(country)
        ]

    def salary_by_department(self) -> list[DepartmentSalaryInsightResource]:
        return [
            DepartmentSalaryInsightResource(
                department=stats.group,
                headcount=stats.headcount,
                average_salary=average_salary(stats),
            )
            for stats in self.repository.salary_stats_by_department()
        ]

    def payroll_overview(self) -> PayrollOverviewResource:
        by_country = self.repository.salary_stats_by_country()
        # The org totals add up the exact per-country SQL sums, so they always match the rows.
        return PayrollOverviewResource(
            headcount=sum(stats.headcount for stats in by_country),
            total_payroll=sum((stats.total_salary for stats in by_country), Decimal(0)),
            payroll_by_country=[
                CountryPayrollResource(
                    country=stats.group,
                    headcount=stats.headcount,
                    total_payroll=stats.total_salary,
                )
                for stats in by_country
            ],
        )
