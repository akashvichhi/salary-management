from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.constants.messages import (
    EMPLOYEE_EMAIL_TAKEN,
    EMPLOYEE_NOT_FOUND,
    INVALID_SORT,
    VALIDATION_FAILED,
)
from tests.factories import employee_payload

EMPLOYEES_URL = "/api/v1/employees"
IST_OFFSET_SUFFIX = "+05:30"
# A taken email is reported on the email field, so the form can show it on that input.
EMAIL_TAKEN_RESPONSE = {
    "error": EMPLOYEE_EMAIL_TAKEN,
    "details": [{"field": "email", "message": EMPLOYEE_EMAIL_TAKEN}],
}


def create_employee(authenticated_client: TestClient, **overrides: Any) -> dict[str, Any]:
    response = authenticated_client.post(EMPLOYEES_URL, json=employee_payload(**overrides))
    assert response.status_code == 201, response.text
    employee: dict[str, Any] = response.json()["data"]
    return employee


def test_create_employee_returns_201_with_the_employee(authenticated_client: TestClient) -> None:
    response = authenticated_client.post(EMPLOYEES_URL, json=employee_payload(salary=85000))

    assert response.status_code == 201
    employee = response.json()["data"]
    assert employee["id"] > 0
    assert employee["full_name"] == "Asha Rao"
    assert employee["salary"] == "85000.00"
    # The salary is in the currency of the employee's country.
    assert employee["currency"] == "INR"
    assert employee["hire_date"] == "2024-03-18"
    assert employee["created_at"].endswith(IST_OFFSET_SUFFIX)
    assert employee["updated_at"].endswith(IST_OFFSET_SUFFIX)


def test_create_employee_returns_field_details_for_invalid_input(
    authenticated_client: TestClient,
) -> None:
    response = authenticated_client.post(EMPLOYEES_URL, json=employee_payload(salary="0"))

    assert response.status_code == 422
    body = response.json()
    assert body["error"] == VALIDATION_FAILED
    assert [detail["field"] for detail in body["details"]] == ["salary"]


def test_create_employee_rejects_an_email_that_differs_only_in_case(
    authenticated_client: TestClient,
) -> None:
    create_employee(authenticated_client, email="asha.rao@acme.com")

    response = authenticated_client.post(
        EMPLOYEES_URL, json=employee_payload(email="Asha.Rao@ACME.com")
    )

    assert response.status_code == 409
    assert response.json() == EMAIL_TAKEN_RESPONSE


def test_update_employee_rejects_an_email_another_employee_has(
    authenticated_client: TestClient,
) -> None:
    create_employee(authenticated_client, email="taken@acme.com")
    created = create_employee(authenticated_client, email="asha.rao@acme.com")

    response = authenticated_client.patch(
        f"{EMPLOYEES_URL}/{created['id']}", json={"email": "taken@acme.com"}
    )

    assert response.status_code == 409
    assert response.json() == EMAIL_TAKEN_RESPONSE


def test_get_employee_returns_200_with_the_employee(authenticated_client: TestClient) -> None:
    created = create_employee(authenticated_client)

    response = authenticated_client.get(f"{EMPLOYEES_URL}/{created['id']}")

    assert response.status_code == 200
    assert response.json() == {"data": created}


def test_get_employee_returns_404_for_an_unknown_id(authenticated_client: TestClient) -> None:
    response = authenticated_client.get(f"{EMPLOYEES_URL}/999")

    assert response.status_code == 404
    assert response.json() == {"error": EMPLOYEE_NOT_FOUND}


def test_update_employee_returns_200_with_the_changed_employee(
    authenticated_client: TestClient,
) -> None:
    created = create_employee(authenticated_client)

    response = authenticated_client.patch(
        f"{EMPLOYEES_URL}/{created['id']}", json={"job_title": "qa engineer"}
    )

    assert response.status_code == 200
    employee = response.json()["data"]
    assert employee["job_title"] == "QA Engineer"
    assert employee["full_name"] == created["full_name"]


def test_update_employee_returns_422_for_a_null_field(authenticated_client: TestClient) -> None:
    created = create_employee(authenticated_client)

    response = authenticated_client.patch(f"{EMPLOYEES_URL}/{created['id']}", json={"salary": None})

    assert response.status_code == 422
    assert [detail["field"] for detail in response.json()["details"]] == ["salary"]


def test_delete_employee_returns_204_and_hides_the_employee(
    authenticated_client: TestClient,
) -> None:
    created = create_employee(authenticated_client)

    response = authenticated_client.delete(f"{EMPLOYEES_URL}/{created['id']}")

    assert response.status_code == 204
    assert response.content == b""
    assert authenticated_client.get(f"{EMPLOYEES_URL}/{created['id']}").status_code == 404


def test_delete_employee_returns_404_for_an_unknown_id(authenticated_client: TestClient) -> None:
    response = authenticated_client.delete(f"{EMPLOYEES_URL}/999")

    assert response.status_code == 404
    assert response.json() == {"error": EMPLOYEE_NOT_FOUND}


def test_list_employees_returns_200_with_data_and_meta(authenticated_client: TestClient) -> None:
    created = create_employee(authenticated_client)

    response = authenticated_client.get(EMPLOYEES_URL)

    assert response.status_code == 200
    assert response.json() == {
        "data": [created],
        "meta": {"total_count": 1, "current_page": 1, "per_page": 20, "total_pages": 1},
    }


def test_list_employees_applies_filters_search_and_sort_from_the_query(
    authenticated_client: TestClient,
) -> None:
    create_employee(
        authenticated_client, full_name="Asha Rao", email="asha@acme.com", salary="50000"
    )
    create_employee(
        authenticated_client, full_name="Ravi Rao", email="ravi@acme.com", salary="90000"
    )
    create_employee(authenticated_client, full_name="Sam Rao", email="sam@acme.com", country="US")

    params = {"country": "in", "search": "rao", "sort": "-salary"}
    response = authenticated_client.get(EMPLOYEES_URL, params=params)

    assert [employee["full_name"] for employee in response.json()["data"]] == [
        "Ravi Rao",
        "Asha Rao",
    ]


def test_list_employees_rejects_an_unknown_sort_field(authenticated_client: TestClient) -> None:
    response = authenticated_client.get(EMPLOYEES_URL, params={"sort": "password"})

    assert response.status_code == 422
    [detail] = response.json()["details"]
    assert detail["field"] == "sort"
    assert INVALID_SORT in detail["message"]


def test_list_employees_rejects_a_page_size_above_the_maximum(
    authenticated_client: TestClient,
) -> None:
    response = authenticated_client.get(EMPLOYEES_URL, params={"per_page": 101})

    assert response.status_code == 422
    assert [detail["field"] for detail in response.json()["details"]] == ["per_page"]


# Larger than SQLite's biggest integer, which used to crash the query with a 500.
TOO_LARGE_NUMBER = 10**22


def test_list_employees_rejects_a_page_beyond_the_maximum(authenticated_client: TestClient) -> None:
    response = authenticated_client.get(EMPLOYEES_URL, params={"page": TOO_LARGE_NUMBER})

    assert response.status_code == 422
    assert [detail["field"] for detail in response.json()["details"]] == ["page"]


@pytest.mark.parametrize("method", ["GET", "PATCH", "DELETE"])
def test_an_employee_id_beyond_the_maximum_is_a_validation_error(
    authenticated_client: TestClient, method: str
) -> None:
    response = authenticated_client.request(method, f"{EMPLOYEES_URL}/{TOO_LARGE_NUMBER}", json={})

    assert response.status_code == 422
    assert [detail["field"] for detail in response.json()["details"]] == ["employee_id"]
