from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
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


WEB_DEV_ORIGIN = "http://localhost:5173"
FOREIGN_ORIGIN = "https://attacker.example"


def preflight(client: TestClient, origin: str) -> dict[str, str]:
    response = client.options(
        "/api/v1/employees",
        headers={"Origin": origin, "Access-Control-Request-Method": "POST"},
    )
    return dict(response.headers)


@pytest.fixture
def dev_client(settings: Settings) -> Iterator[TestClient]:
    dev_settings = settings.model_copy(update={"allowed_origins": [WEB_DEV_ORIGIN]})
    with TestClient(create_app(dev_settings)) as test_client:
        yield test_client


def test_the_web_dev_server_is_allowed_through_cors_with_cookies(dev_client: TestClient) -> None:
    headers = preflight(dev_client, WEB_DEV_ORIGIN)

    assert headers["access-control-allow-origin"] == WEB_DEV_ORIGIN
    assert headers["access-control-allow-credentials"] == "true"


def test_a_foreign_origin_is_not_allowed_through_cors(dev_client: TestClient) -> None:
    headers = preflight(dev_client, FOREIGN_ORIGIN)

    assert "access-control-allow-origin" not in headers


def test_cors_is_off_when_no_origins_are_configured(client: TestClient) -> None:
    headers = preflight(client, WEB_DEV_ORIGIN)

    assert "access-control-allow-origin" not in headers
