from fastapi.testclient import TestClient

from app.main import APP_TITLE, create_app
from tests.integration.test_employee_router import create_employee


def test_create_app_returns_the_salary_management_api() -> None:
    app = create_app()

    assert app.title == APP_TITLE


GZIP_HEADERS = {"Accept-Encoding": "gzip"}
EMPLOYEES_FOR_A_LARGE_RESPONSE = 10


def test_large_responses_are_compressed(client: TestClient) -> None:
    for number in range(EMPLOYEES_FOR_A_LARGE_RESPONSE):
        create_employee(client, email=f"employee{number}@acme.com")

    response = client.get("/api/v1/employees", headers=GZIP_HEADERS)

    assert response.headers["content-encoding"] == "gzip"
    assert response.json()["meta"]["total_count"] == EMPLOYEES_FOR_A_LARGE_RESPONSE


def test_tiny_responses_are_not_compressed(client: TestClient) -> None:
    response = client.get("/api/health", headers=GZIP_HEADERS)

    assert "content-encoding" not in response.headers
