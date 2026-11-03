import pytest
from fastapi.testclient import TestClient

from app.constants.messages import VALIDATION_FAILED
from tests.integration.test_employee_router import create_employee

INSIGHTS_URL = "/api/v1/salary-insights"


def test_salary_by_country_returns_an_array_with_money_as_strings(client: TestClient) -> None:
    create_employee(client, email="a@acme.com", country="IN", salary="20000")
    create_employee(client, email="b@acme.com", country="IN", salary="30000.50")

    response = client.get(f"{INSIGHTS_URL}/by-country")

    assert response.status_code == 200
    assert response.json() == {
        "data": [
            {
                "country": "IN",
                "headcount": 2,
                "min_salary": "20000.00",
                "max_salary": "30000.50",
                "average_salary": "25000.25",
                "median_salary": "25000.25",
            }
        ]
    }


def test_salary_by_country_of_an_empty_database_is_an_empty_list(client: TestClient) -> None:
    response = client.get(f"{INSIGHTS_URL}/by-country")

    assert response.status_code == 200
    assert response.json() == {"data": []}


def test_salary_by_job_title_reads_the_country_ignoring_case(client: TestClient) -> None:
    create_employee(client, email="a@acme.com", country="IN", job_title="Accountant")
    create_employee(client, email="b@acme.com", country="US", job_title="Accountant")

    response = client.get(f"{INSIGHTS_URL}/by-job-title", params={"country": "in"})

    assert response.status_code == 200
    assert response.json() == {
        "data": [{"job_title": "Accountant", "headcount": 1, "average_salary": "85000.00"}]
    }


@pytest.mark.parametrize("params", [{}, {"country": "XX"}])
def test_salary_by_job_title_needs_a_known_country(
    client: TestClient, params: dict[str, str]
) -> None:
    response = client.get(f"{INSIGHTS_URL}/by-job-title", params=params)

    assert response.status_code == 422
    assert response.json()["error"] == VALIDATION_FAILED
    assert [detail["field"] for detail in response.json()["details"]] == ["country"]
