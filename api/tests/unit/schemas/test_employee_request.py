from decimal import Decimal
from typing import Any

import pytest
from pydantic import ValidationError

from app.constants.employee_constants import EmployeeSortField
from app.constants.messages import FIELD_CANNOT_BE_NULL, INVALID_SORT
from app.schemas.requests.employee_request import (
    EmployeeCreateRequest,
    EmployeeListRequest,
    EmployeeUpdateRequest,
)
from tests.factories import employee_payload


def create_request(**overrides: Any) -> EmployeeCreateRequest:
    return EmployeeCreateRequest.model_validate(employee_payload(**overrides))


def rejected_fields(**overrides: Any) -> set[str]:
    with pytest.raises(ValidationError) as error:
        create_request(**overrides)
    return {str(detail["loc"][0]) for detail in error.value.errors()}


def test_text_fields_are_trimmed() -> None:
    request = create_request(full_name="  Asha Rao  ")

    assert request.full_name == "Asha Rao"


@pytest.mark.parametrize("blank", ["", "   "])
def test_a_blank_full_name_is_rejected(blank: str) -> None:
    assert rejected_fields(full_name=blank) == {"full_name"}


def test_email_is_lowercased() -> None:
    assert create_request(email="Asha.Rao@ACME.com").email == "asha.rao@acme.com"


def test_an_invalid_email_is_rejected() -> None:
    assert rejected_fields(email="not-an-email") == {"email"}


def test_country_code_is_uppercased() -> None:
    assert create_request(country=" in ").country == "IN"


def test_a_country_outside_the_allowed_list_is_rejected() -> None:
    assert rejected_fields(country="XX") == {"country"}


def test_a_country_that_is_not_text_is_rejected() -> None:
    assert rejected_fields(country=91) == {"country"}


def test_department_and_job_title_match_the_allowed_list_ignoring_case() -> None:
    request = create_request(department="engineering", job_title=" software engineer ")

    assert request.department == "Engineering"
    assert request.job_title == "Software Engineer"


def test_a_department_or_job_title_outside_the_allowed_list_is_rejected() -> None:
    assert rejected_fields(department="Astrology", job_title="Wizard") == {
        "department",
        "job_title",
    }


@pytest.mark.parametrize("salary", ["0", "-1.00"])
def test_salary_must_be_greater_than_zero(salary: str) -> None:
    assert rejected_fields(salary=salary) == {"salary"}


def test_salary_with_more_than_two_decimals_is_rejected() -> None:
    assert rejected_fields(salary="100.123") == {"salary"}


def test_every_field_is_required() -> None:
    with pytest.raises(ValidationError) as error:
        EmployeeCreateRequest.model_validate({})

    assert len(error.value.errors()) == len(EmployeeCreateRequest.model_fields)


def test_update_request_keeps_only_the_fields_that_were_sent() -> None:
    request = EmployeeUpdateRequest.model_validate({"salary": "90000.00"})

    assert request.model_dump(exclude_unset=True) == {"salary": Decimal("90000.00")}


def test_update_request_normalises_like_create() -> None:
    request = EmployeeUpdateRequest.model_validate({"email": " Asha@ACME.com ", "country": "us"})

    assert request.email == "asha@acme.com"
    assert request.country == "US"


def test_update_request_rejects_null_for_a_field() -> None:
    with pytest.raises(ValidationError) as error:
        EmployeeUpdateRequest.model_validate({"full_name": None})

    [detail] = error.value.errors()
    assert detail["loc"] == ("full_name",)
    assert FIELD_CANNOT_BE_NULL in detail["msg"]


def test_list_request_defaults_to_the_first_page_sorted_by_name() -> None:
    request = EmployeeListRequest()

    assert request.page == 1
    assert request.per_page == 20
    assert request.sort_field is EmployeeSortField.FULL_NAME
    assert request.sort_descending is False


def test_list_request_reads_a_leading_minus_as_descending() -> None:
    request = EmployeeListRequest(sort="-salary")

    assert request.sort_field is EmployeeSortField.SALARY
    assert request.sort_descending is True


@pytest.mark.parametrize("sort", ["password", "-", "--salary", ""])
def test_list_request_rejects_a_sort_outside_the_allowed_fields(sort: str) -> None:
    with pytest.raises(ValidationError) as error:
        EmployeeListRequest(sort=sort)

    assert INVALID_SORT in str(error.value)


def test_list_request_normalises_filters_like_create() -> None:
    request = EmployeeListRequest.model_validate(
        {"country": "in", "department": "sales", "job_title": "data analyst", "search": "  rao "}
    )

    assert request.country == "IN"
    assert request.department == "Sales"
    assert request.job_title == "Data Analyst"
    assert request.search == "rao"


def test_list_request_treats_a_blank_search_as_no_search() -> None:
    assert EmployeeListRequest(search="   ").search is None
