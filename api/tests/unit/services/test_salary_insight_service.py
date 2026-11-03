from decimal import Decimal
from typing import Any

import pytest
from sqlalchemy.orm import Session

from app.constants.employee_constants import Country
from app.repositories.salary_insight_repository import SalaryInsightRepository
from app.schemas.resources.salary_insight_resource import (
    CountryPayrollResource,
    CountrySalaryInsightResource,
    DepartmentSalaryInsightResource,
    JobTitleSalaryInsightResource,
    PayrollOverviewResource,
)
from app.services.salary_insight_service import SalaryInsightService
from tests.factories import build_employee


@pytest.fixture
def service(session: Session) -> SalaryInsightService:
    return SalaryInsightService(SalaryInsightRepository(session))


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
            headcount=3,
            min_salary=Decimal("10000.00"),
            max_salary=Decimal("60000.00"),
            average_salary=Decimal("30000.00"),
            median_salary=Decimal("20000.00"),  # odd count: the middle value
        ),
        CountrySalaryInsightResource(
            country="US",
            headcount=2,
            min_salary=Decimal("100000.00"),
            max_salary=Decimal("100000.01"),
            # 100000.005 rounds half-up to the cent.
            average_salary=Decimal("100000.01"),
            median_salary=Decimal("100000.01"),  # even count: the mean of the middle two
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
            job_title="Accountant", headcount=1, average_salary=Decimal("40000.00")
        ),
        JobTitleSalaryInsightResource(
            job_title="Software Engineer", headcount=2, average_salary=Decimal("75000.01")
        ),
    ]


def test_salary_by_job_title_of_a_country_with_no_employees_is_an_empty_list(
    service: SalaryInsightService, session: Session
) -> None:
    save_employees(session, paid("50000", country="IN"))

    assert service.salary_by_job_title(Country.FRANCE) == []


def test_salary_by_department_gives_headcount_and_average_across_countries(
    service: SalaryInsightService, session: Session
) -> None:
    save_employees(
        session,
        paid("90000", department="Engineering", country="US"),
        paid("30000", department="Engineering", country="IN"),
        paid("45000", department="Sales"),
        paid("999999", department="Sales", is_active=False),
    )

    assert service.salary_by_department() == [
        DepartmentSalaryInsightResource(
            department="Engineering", headcount=2, average_salary=Decimal("60000.00")
        ),
        DepartmentSalaryInsightResource(
            department="Sales", headcount=1, average_salary=Decimal("45000.00")
        ),
    ]


def test_salary_by_department_of_an_empty_database_is_an_empty_list(
    service: SalaryInsightService,
) -> None:
    assert service.salary_by_department() == []


def test_payroll_overview_gives_headcount_total_and_payroll_by_country(
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
        total_payroll=Decimal("150000.50"),
        payroll_by_country=[
            CountryPayrollResource(country="IN", headcount=2, total_payroll=Decimal("50000.50")),
            CountryPayrollResource(country="US", headcount=1, total_payroll=Decimal("100000.00")),
        ],
    )


def test_payroll_overview_of_an_empty_database_is_zeros(service: SalaryInsightService) -> None:
    assert service.payroll_overview() == PayrollOverviewResource(
        headcount=0, total_payroll=Decimal("0.00"), payroll_by_country=[]
    )
