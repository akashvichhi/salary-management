from collections import defaultdict
from decimal import Decimal
from statistics import median

from app.constants.employee_constants import Country
from app.core.currency_converter import CurrencyConverter, currency_of
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
    """Figures within one country stay in its currency; figures across countries are in USD."""

    def __init__(self, repository: SalaryInsightRepository, converter: CurrencyConverter) -> None:
        self.repository = repository
        self.converter = converter

    def salary_by_country(self) -> list[CountrySalaryInsightResource]:
        medians = median_by_group(self.repository.salaries_by_country())
        return [
            CountrySalaryInsightResource(
                country=stats.group,
                currency=currency_of(stats.group),
                headcount=stats.headcount,
                min_salary=stats.min_salary,
                max_salary=stats.max_salary,
                average_salary=average_salary(stats),
                median_salary=medians[stats.group],
                average_salary_usd=round_to_cents(
                    self.converter.to_usd(stats.total_salary, stats.group) / stats.headcount
                ),
            )
            for stats in self.repository.salary_stats_by_country()
        ]

    def salary_by_job_title(self, country: Country) -> list[JobTitleSalaryInsightResource]:
        return [
            JobTitleSalaryInsightResource(
                job_title=stats.group,
                currency=currency_of(country),
                headcount=stats.headcount,
                average_salary=average_salary(stats),
            )
            for stats in self.repository.salary_stats_by_job_title(country)
        ]

    def salary_by_department(self) -> list[DepartmentSalaryInsightResource]:
        # Each country's exact total is converted, then added up: every employee weighs the
        # same, and nothing is rounded until the average.
        headcounts: defaultdict[str, int] = defaultdict(int)
        usd_totals: defaultdict[str, Decimal] = defaultdict(Decimal)
        for total in self.repository.salary_totals_by_department_and_country():
            headcounts[total.group] += total.headcount
            usd_totals[total.group] += self.converter.to_usd(total.total_salary, total.country)
        return [
            DepartmentSalaryInsightResource(
                department=department,
                headcount=headcount,
                average_salary_usd=round_to_cents(usd_totals[department] / headcount),
            )
            for department, headcount in headcounts.items()
        ]

    def payroll_overview(self) -> PayrollOverviewResource:
        payroll_by_country = [
            CountryPayrollResource(
                country=stats.group,
                currency=currency_of(stats.group),
                headcount=stats.headcount,
                total_payroll=stats.total_salary,
                total_payroll_usd=round_to_cents(
                    self.converter.to_usd(stats.total_salary, stats.group)
                ),
            )
            for stats in self.repository.salary_stats_by_country()
        ]
        # The org total adds up the rows as shown, so it always matches the table.
        return PayrollOverviewResource(
            headcount=sum(row.headcount for row in payroll_by_country),
            total_payroll_usd=sum(
                (row.total_payroll_usd for row in payroll_by_country), Decimal(0)
            ),
            payroll_by_country=payroll_by_country,
        )
