from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.constants.messages import ORIGIN_NOT_ALLOWED
from app.core.config import Settings
from app.main import create_app
from tests.factories import login_payload

LOGIN_URL = "/api/v1/auth/login"
EMPLOYEES_URL = "/api/v1/employees"
WEB_DEV_ORIGIN = "http://localhost:5173"
FOREIGN_ORIGIN = "https://attacker.example"
# The test client's own address, as a browser on the deployed site would send it.
SAME_ORIGIN = "http://testserver"


def from_origin(origin: str) -> dict[str, str]:
    return {"Origin": origin}


@pytest.fixture
def dev_client(settings: Settings) -> Iterator[TestClient]:
    dev_settings = settings.model_copy(update={"allowed_origins": [WEB_DEV_ORIGIN]})
    with TestClient(create_app(dev_settings)) as test_client:
        yield test_client


@pytest.mark.usefixtures("hr_manager")
@pytest.mark.parametrize("method", ["POST", "PATCH", "PUT", "DELETE"])
def test_a_write_from_a_foreign_origin_returns_403(client: TestClient, method: str) -> None:
    response = client.request(method, LOGIN_URL, headers=from_origin(FOREIGN_ORIGIN))

    assert response.status_code == 403
    assert response.json() == {"error": ORIGIN_NOT_ALLOWED}


@pytest.mark.usefixtures("hr_manager")
def test_a_rejected_write_never_reaches_the_route(client: TestClient) -> None:
    response = client.post(LOGIN_URL, json=login_payload(), headers=from_origin(FOREIGN_ORIGIN))

    assert response.status_code == 403
    assert "set-cookie" not in response.headers


@pytest.mark.usefixtures("hr_manager")
def test_a_write_from_the_same_origin_is_allowed(client: TestClient) -> None:
    response = client.post(LOGIN_URL, json=login_payload(), headers=from_origin(SAME_ORIGIN))

    assert response.status_code == 200


@pytest.mark.usefixtures("hr_manager")
def test_a_write_from_an_allowed_origin_is_allowed(dev_client: TestClient) -> None:
    response = dev_client.post(LOGIN_URL, json=login_payload(), headers=from_origin(WEB_DEV_ORIGIN))

    assert response.status_code == 200


@pytest.mark.usefixtures("hr_manager")
def test_a_write_without_an_origin_header_is_allowed(client: TestClient) -> None:
    # Browsers always send Origin on cross-site writes; only non-browser clients leave it out.
    assert client.post(LOGIN_URL, json=login_payload()).status_code == 200


def test_a_read_from_a_foreign_origin_is_not_blocked(authenticated_client: TestClient) -> None:
    response = authenticated_client.get(EMPLOYEES_URL, headers=from_origin(FOREIGN_ORIGIN))

    assert response.status_code == 200
