from typing import Any

from fastapi.testclient import TestClient

from app.constants.messages import EMPLOYEE_EMAIL_TAKEN, EMPLOYEE_NOT_FOUND, VALIDATION_FAILED
from tests.factories import employee_payload

EMPLOYEES_URL = "/api/v1/employees"
IST_OFFSET_SUFFIX = "+05:30"


def create_employee(client: TestClient, **overrides: Any) -> dict[str, Any]:
    response = client.post(EMPLOYEES_URL, json=employee_payload(**overrides))
    assert response.status_code == 201, response.text
    employee: dict[str, Any] = response.json()["data"]
    return employee


def test_create_employee_returns_201_with_the_employee(client: TestClient) -> None:
    response = client.post(EMPLOYEES_URL, json=employee_payload(salary=85000))

    assert response.status_code == 201
    employee = response.json()["data"]
    assert employee["id"] > 0
    assert employee["full_name"] == "Asha Rao"
    assert employee["salary"] == "85000.00"
    assert employee["hire_date"] == "2024-03-18"
    assert employee["created_at"].endswith(IST_OFFSET_SUFFIX)
    assert employee["updated_at"].endswith(IST_OFFSET_SUFFIX)


def test_create_employee_returns_field_details_for_invalid_input(client: TestClient) -> None:
    response = client.post(EMPLOYEES_URL, json=employee_payload(salary="0"))

    assert response.status_code == 422
    body = response.json()
    assert body["error"] == VALIDATION_FAILED
    assert [detail["field"] for detail in body["details"]] == ["salary"]


def test_create_employee_rejects_an_email_that_differs_only_in_case(client: TestClient) -> None:
    create_employee(client, email="asha.rao@acme.com")

    response = client.post(EMPLOYEES_URL, json=employee_payload(email="Asha.Rao@ACME.com"))

    assert response.status_code == 409
    assert response.json() == {"error": EMPLOYEE_EMAIL_TAKEN}


def test_get_employee_returns_200_with_the_employee(client: TestClient) -> None:
    created = create_employee(client)

    response = client.get(f"{EMPLOYEES_URL}/{created['id']}")

    assert response.status_code == 200
    assert response.json() == {"data": created}


def test_get_employee_returns_404_for_an_unknown_id(client: TestClient) -> None:
    response = client.get(f"{EMPLOYEES_URL}/999")

    assert response.status_code == 404
    assert response.json() == {"error": EMPLOYEE_NOT_FOUND}
