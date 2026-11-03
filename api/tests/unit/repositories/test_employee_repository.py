from datetime import date
from decimal import Decimal
from typing import Any

import pytest
from sqlalchemy import Select, text
from sqlalchemy.dialects import sqlite
from sqlalchemy.orm import Session

from app.constants.employee_constants import EmployeeSortField
from app.models.employee_model import EmployeeModel
from app.repositories.employee_repository import EmployeeRepository, active_employees
from app.schemas.requests.employee_request import EmployeeListRequest
from tests.factories import build_employee


def save_employees(session: Session, *employees_fields: dict[str, Any]) -> None:
    for index, fields in enumerate(employees_fields):
        session.add(build_employee(**{"email": f"employee{index}@acme.com", **fields}))
    session.commit()


def list_request(**params: Any) -> EmployeeListRequest:
    return EmployeeListRequest.model_validate(params)


def listed_names(session: Session, **params: Any) -> list[str]:
    items, _ = EmployeeRepository(session).list_active(list_request(**params))
    return [employee.full_name for employee in items]


def test_list_returns_one_page_and_the_total_count(session: Session) -> None:
    save_employees(session, *({"full_name": f"Person {number:02}"} for number in range(25)))

    items, total_count = EmployeeRepository(session).list_active(list_request(page=2, per_page=10))

    assert total_count == 25
    assert [employee.full_name for employee in items] == [f"Person {n:02}" for n in range(10, 20)]


def test_list_of_an_empty_table_is_empty(session: Session) -> None:
    items, total_count = EmployeeRepository(session).list_active(list_request())

    assert items == []
    assert total_count == 0


def test_list_leaves_out_deleted_employees(session: Session) -> None:
    save_employees(session, {"full_name": "Active"}, {"full_name": "Deleted", "is_active": False})

    items, total_count = EmployeeRepository(session).list_active(list_request())

    assert [employee.full_name for employee in items] == ["Active"]
    assert total_count == 1


@pytest.mark.parametrize(
    ("filter_params", "expected"),
    [
        ({"country": "IN"}, ["Asha", "Ravi"]),
        ({"job_title": "Data Analyst"}, ["Ravi", "Sam"]),
        ({"department": "Sales"}, ["Sam"]),
        ({"country": "IN", "job_title": "Data Analyst"}, ["Ravi"]),
    ],
)
def test_list_filters_by_country_job_title_and_department(
    session: Session, filter_params: dict[str, str], expected: list[str]
) -> None:
    save_employees(
        session,
        {"full_name": "Asha", "country": "IN", "job_title": "Software Engineer"},
        {"full_name": "Ravi", "country": "IN", "job_title": "Data Analyst"},
        {"full_name": "Sam", "country": "US", "job_title": "Data Analyst", "department": "Sales"},
    )

    assert listed_names(session, **filter_params) == expected


@pytest.mark.parametrize("search", ["ASHA", "rao", "a.rao@ACME"])
def test_search_matches_part_of_the_name_or_email_ignoring_case(
    session: Session, search: str
) -> None:
    session.add(build_employee(full_name="Asha Rao", email="a.rao@acme.com"))
    session.add(build_employee(full_name="Sam Lee", email="sam.lee@acme.com"))
    session.commit()

    assert listed_names(session, search=search) == ["Asha Rao"]


def test_search_treats_wildcard_characters_literally(session: Session) -> None:
    save_employees(session, {"full_name": "100% Rao"}, {"full_name": "Asha Rao"})

    assert listed_names(session, search="%") == ["100% Rao"]


def test_list_sorts_by_full_name_by_default(session: Session) -> None:
    save_employees(session, {"full_name": "Zara"}, {"full_name": "Asha"}, {"full_name": "Mira"})

    assert listed_names(session) == ["Asha", "Mira", "Zara"]


def test_list_sorts_by_salary_ascending_and_descending(session: Session) -> None:
    save_employees(
        session,
        {"full_name": "Mid", "salary": Decimal("50000.00")},
        {"full_name": "High", "salary": Decimal("90000.00")},
        {"full_name": "Low", "salary": Decimal("10000.00")},
    )

    assert listed_names(session, sort="salary") == ["Low", "Mid", "High"]
    assert listed_names(session, sort="-salary") == ["High", "Mid", "Low"]


def test_equal_sort_values_keep_a_stable_order_by_id(session: Session) -> None:
    same_salary = Decimal("50000.00")
    save_employees(
        session,
        {"full_name": "First", "salary": same_salary},
        {"full_name": "Second", "salary": same_salary},
    )

    assert listed_names(session, sort="-salary") == ["First", "Second"]


@pytest.mark.parametrize("field", list(EmployeeSortField))
def test_every_sort_field_orders_the_list(session: Session, field: EmployeeSortField) -> None:
    save_employees(
        session,
        {
            "full_name": "B",
            "job_title": "QA Engineer",
            "department": "Sales",
            "country": "US",
            "salary": Decimal("2.00"),
            "hire_date": date(2024, 2, 1),
        },
        {
            "full_name": "A",
            "job_title": "Accountant",
            "department": "Design",
            "country": "IN",
            "salary": Decimal("1.00"),
            "hire_date": date(2024, 1, 1),
        },
    )
    # The emails are employee0@ (B) and employee1@ (A), so email sorts B first.
    expected = ["B", "A"] if field is EmployeeSortField.EMAIL else ["A", "B"]

    assert listed_names(session, sort=field.value) == expected
    assert listed_names(session, sort=f"-{field.value}") == list(reversed(expected))


def query_plan(session: Session, query: Select[EmployeeModel]) -> str:
    sql = query.compile(dialect=sqlite.dialect(), compile_kwargs={"literal_binds": True})
    return " ".join(row[-1] for row in session.execute(text(f"EXPLAIN QUERY PLAN {sql}")))


def test_the_duplicate_email_check_uses_the_active_email_index(session: Session) -> None:
    query = active_employees().where(EmployeeModel.email == "asha.rao@acme.com")

    # Without the index, every create and email change scans all 10,000 rows.
    assert query_plan(session, query).startswith(
        "SEARCH employees USING INDEX uq_employees_active_email"
    )
