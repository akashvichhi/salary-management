import pytest
from fastapi.testclient import TestClient

from app.constants.messages import VALIDATION_FAILED
from tests.integration.test_employee_router import create_employee

INSIGHTS_URL = "/api/v1/salary-insights"


def test_salary_by_country_returns_an_array_with_money_as_strings(
    authenticated_client: TestClient,
) -> None:
    create_employee(authenticated_client, email="a@acme.com", country="IN", salary="20000")
    create_employee(authenticated_client, email="b@acme.com", country="IN", salary="30000.50")

    response = authenticated_client.get(f"{INSIGHTS_URL}/by-country")

    assert response.status_code == 200
    assert response.json() == {
        "data": [
            {
                "country": "IN",
                "currency": "INR",
                "headcount": 2,
                "min_salary": "20000.00",
                "max_salary": "30000.50",
                "average_salary": "25000.25",
                "median_salary": "25000.25",
                "average_salary_usd": "312.50",  # at the test rate of 80 INR to the dollar
            }
        ]
    }


def test_salary_by_country_of_an_empty_database_is_an_empty_list(
    authenticated_client: TestClient,
) -> None:
    response = authenticated_client.get(f"{INSIGHTS_URL}/by-country")

    assert response.status_code == 200
    assert response.json() == {"data": []}


def test_salary_by_job_title_reads_the_country_ignoring_case(
    authenticated_client: TestClient,
) -> None:
    create_employee(authenticated_client, email="a@acme.com", country="IN", job_title="Accountant")
    create_employee(authenticated_client, email="b@acme.com", country="US", job_title="Accountant")

    response = authenticated_client.get(f"{INSIGHTS_URL}/by-job-title", params={"country": "in"})

    assert response.status_code == 200
    assert response.json() == {
        "data": [
            {
                "job_title": "Accountant",
                "currency": "INR",
                "headcount": 1,
                "average_salary": "85000.00",
            }
        ]
    }


@pytest.mark.parametrize("params", [{}, {"country": "XX"}])
def test_salary_by_job_title_needs_a_known_country(
    authenticated_client: TestClient, params: dict[str, str]
) -> None:
    response = authenticated_client.get(f"{INSIGHTS_URL}/by-job-title", params=params)

    assert response.status_code == 422
    assert response.json()["error"] == VALIDATION_FAILED
    assert [detail["field"] for detail in response.json()["details"]] == ["country"]


def test_salary_by_department_returns_an_array_with_money_as_strings(
    authenticated_client: TestClient,
) -> None:
    create_employee(
        authenticated_client, email="a@acme.com", department="Legal", country="US", salary="70000"
    )

    response = authenticated_client.get(f"{INSIGHTS_URL}/by-department")

    assert response.status_code == 200
    assert response.json() == {
        "data": [{"department": "Legal", "headcount": 1, "average_salary_usd": "70000.00"}]
    }


def test_payroll_overview_returns_totals_with_money_as_strings(
    authenticated_client: TestClient,
) -> None:
    create_employee(authenticated_client, email="a@acme.com", country="IN", salary="20000")
    create_employee(authenticated_client, email="b@acme.com", country="US", salary="80000.50")

    response = authenticated_client.get(f"{INSIGHTS_URL}/overview")

    assert response.status_code == 200
    assert response.json() == {
        "data": {
            "headcount": 2,
            "total_payroll_usd": "80250.50",
            "payroll_by_country": [
                {
                    "country": "IN",
                    "currency": "INR",
                    "headcount": 1,
                    "total_payroll": "20000.00",
                    "total_payroll_usd": "250.00",
                },
                {
                    "country": "US",
                    "currency": "USD",
                    "headcount": 1,
                    "total_payroll": "80000.50",
                    "total_payroll_usd": "80000.50",
                },
            ],
        }
    }


def test_payroll_overview_of_an_empty_database_is_zeros(authenticated_client: TestClient) -> None:
    response = authenticated_client.get(f"{INSIGHTS_URL}/overview")

    assert response.json() == {
        "data": {"headcount": 0, "total_payroll_usd": "0.00", "payroll_by_country": []}
    }
