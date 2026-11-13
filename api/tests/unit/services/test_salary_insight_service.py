from decimal import Decimal
from typing import Any

import pytest
from sqlalchemy import insert
from sqlalchemy.orm import Session

from app.constants.employee_constants import Country
from app.core.currency_converter import CurrencyConverter
from app.models.employee_model import EmployeeModel
from app.repositories.salary_insight_repository import SalaryInsightRepository
from app.schemas.resources.salary_insight_resource import (
    CountryPayrollResource,
    CountrySalaryInsightResource,
    DepartmentSalaryInsightResource,
    JobTitleSalaryInsightResource,
    PayrollOverviewResource,
)
from app.services.salary_insight_service import SalaryInsightService
from tests.factories import DEFAULT_EMPLOYEE_FIELDS, build_employee


@pytest.fixture
def service(session: Session, converter: CurrencyConverter) -> SalaryInsightService:
    return SalaryInsightService(SalaryInsightRepository(session), converter)


def save_employees(session: Session, *employees_fields: dict[str, Any]) -> None:
    for index, fields in enumerate(employees_fields):
        session.add(build_employee(email=f"employee{index}@acme.com", **fields))
    session.commit()


def paid(salary: str, **fields: Any) -> dict[str, Any]:
    return {"salary": Decimal(salary), **fields}


def test_salary_by_country_gives_headcount_min_max_average_and_median(
    service: SalaryInsightService, session: Session
) -> None:
    save_employees(
        session,
        paid("10000.00", country="IN"),
        paid("60000.00", country="IN"),
        paid("20000.00", country="IN"),
        paid("100000.00", country="US"),
        paid("100000.01", country="US"),
    )

    assert service.salary_by_country() == [
        CountrySalaryInsightResource(
            country="IN",
            currency="INR",
            headcount=3,
            min_salary=Decimal("10000.00"),
            max_salary=Decimal("60000.00"),
            average_salary=Decimal("30000.00"),
            median_salary=Decimal("20000.00"),  # odd count: the middle value
            average_salary_usd=Decimal("375.00"),  # 30,000 INR at 80 to the dollar
        ),
        CountrySalaryInsightResource(
            country="US",
            currency="USD",
            headcount=2,
            min_salary=Decimal("100000.00"),
            max_salary=Decimal("100000.01"),
            # 100000.005 rounds half-up to the cent.
            average_salary=Decimal("100000.01"),
            median_salary=Decimal("100000.01"),  # even count: the mean of the middle two
            average_salary_usd=Decimal("100000.01"),
        ),
    ]


def test_salary_by_country_median_of_an_even_count_is_the_mean_of_the_middle_two(
    service: SalaryInsightService, session: Session
) -> None:
    save_employees(
        session,
        *(paid(salary, country="IN") for salary in ["10000", "100000", "30000", "20000"]),
    )

    [india] = service.salary_by_country()

    assert india.median_salary == Decimal("25000.00")
    assert india.average_salary == Decimal("40000.00")


def test_salary_by_country_converts_the_average_from_the_exact_total(
    service: SalaryInsightService, session: Session
) -> None:
    # At 0.5 EUR to the dollar, the 200.01 EUR total is 400.02 USD. The exact total is
    # converted and divided, and only the result is rounded.
    save_employees(session, paid("100.00", country="FR"), paid("100.01", country="FR"))

    [france] = service.salary_by_country()

    assert france.currency == "EUR"
    assert france.average_salary == Decimal("100.01")  # 100.005 rounds half-up
    assert france.average_salary_usd == Decimal("200.01")


def test_salary_by_country_rounds_an_unending_average_to_the_cent(
    service: SalaryInsightService, session: Session
) -> None:
    save_employees(session, *(paid(salary) for salary in ["100.00", "100.00", "100.01"]))

    [country] = service.salary_by_country()

    assert country.average_salary == Decimal("100.00")


def test_salary_by_country_leaves_out_deleted_employees(
    service: SalaryInsightService, session: Session
) -> None:
    save_employees(session, paid("50000"), paid("999999", is_active=False))

    [country] = service.salary_by_country()

    assert country.headcount == 1
    assert country.max_salary == Decimal("50000.00")


def test_salary_by_country_of_an_empty_database_is_an_empty_list(
    service: SalaryInsightService,
) -> None:
    assert service.salary_by_country() == []


def test_salary_by_job_title_counts_only_the_chosen_country(
    service: SalaryInsightService, session: Session
) -> None:
    save_employees(
        session,
        paid("100000", country="IN", job_title="Software Engineer"),
        paid("50000.01", country="IN", job_title="Software Engineer"),
        paid("40000", country="IN", job_title="Accountant"),
        paid("999999", country="US", job_title="Software Engineer"),
        paid("888888", country="IN", job_title="Accountant", is_active=False),
    )

    assert service.salary_by_job_title(Country.INDIA) == [
        JobTitleSalaryInsightResource(
            job_title="Accountant",
            currency="INR",
            headcount=1,
            average_salary=Decimal("40000.00"),
        ),
        JobTitleSalaryInsightResource(
            job_title="Software Engineer",
            currency="INR",
            headcount=2,
            average_salary=Decimal("75000.01"),
        ),
    ]


def test_salary_by_job_title_of_a_country_with_no_employees_is_an_empty_list(
    service: SalaryInsightService, session: Session
) -> None:
    save_employees(session, paid("50000", country="IN"))

    assert service.salary_by_job_title(Country.FRANCE) == []


def test_salary_by_department_gives_headcount_and_average_in_usd_across_countries(
    service: SalaryInsightService, session: Session
) -> None:
    save_employees(
        session,
        paid("90000", department="Engineering", country="US"),
        paid("8000", department="Engineering", country="IN"),  # 100 USD
        paid("8000", department="Engineering", country="IN"),  # 100 USD
        paid("4000", department="Sales", country="IN"),  # 50 USD
        paid("999999", department="Sales", is_active=False),
    )

    assert service.salary_by_department() == [
        # Every employee counts once: (90,000 + 100 + 100) / 3, not the mean of the
        # two countries' averages (45,050).
        DepartmentSalaryInsightResource(
            department="Engineering", headcount=3, average_salary_usd=Decimal("30066.67")
        ),
        DepartmentSalaryInsightResource(
            department="Sales", headcount=1, average_salary_usd=Decimal("50.00")
        ),
    ]


def test_salary_by_department_of_an_empty_database_is_an_empty_list(
    service: SalaryInsightService,
) -> None:
    assert service.salary_by_department() == []


def test_payroll_overview_gives_headcount_usd_total_and_payroll_by_country(
    service: SalaryInsightService, session: Session
) -> None:
    save_employees(
        session,
        paid("30000.25", country="IN"),
        paid("20000.25", country="IN"),
        paid("100000", country="US"),
        paid("999999", country="US", is_active=False),
    )

    assert service.payroll_overview() == PayrollOverviewResource(
        headcount=3,
        # The sum of the rows' USD figures, so the total always matches the table.
        total_payroll_usd=Decimal("100625.01"),
        payroll_by_country=[
            CountryPayrollResource(
                country="IN",
                currency="INR",
                headcount=2,
                total_payroll=Decimal("50000.50"),
                total_payroll_usd=Decimal("625.01"),  # 625.00625 rounds half-up
            ),
            CountryPayrollResource(
                country="US",
                currency="USD",
                headcount=1,
                total_payroll=Decimal("100000.00"),
                total_payroll_usd=Decimal("100000.00"),
            ),
        ],
    )


def test_payroll_overview_of_an_empty_database_is_zeros(service: SalaryInsightService) -> None:
    assert service.payroll_overview() == PayrollOverviewResource(
        headcount=0, total_payroll_usd=Decimal("0.00"), payroll_by_country=[]
    )


def test_payroll_overview_adds_salaries_exactly_to_the_cent(
    service: SalaryInsightService, session: Session
) -> None:
    # Near the largest salary allowed, 10,000 salaries added up as floats lose the last cent.
    salaries = [Decimal("9999999999.99")] * 9_999 + [Decimal("9999999999.00")]
    session.execute(
        insert(EmployeeModel),
        [
            {**DEFAULT_EMPLOYEE_FIELDS, "email": f"employee{index}@acme.com", "salary": salary}
            for index, salary in enumerate(salaries)
        ],
    )
    session.commit()

    [india] = service.payroll_overview().payroll_by_country
    assert india.total_payroll == Decimal("99999999999899.01")
