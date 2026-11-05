from collections.abc import Iterator

import pytest
from fastapi import APIRouter, FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field, field_validator

from app.constants.messages import INTERNAL_SERVER_ERROR, VALIDATION_FAILED
from app.core.config import Settings
from app.core.exceptions import ConflictError, DomainValidationError, NotFoundError
from app.main import create_app

TEST_ROUTE_PREFIX = "/api/test-errors"
NOT_FOUND_MESSAGE = "Thing not found"
CONFLICT_MESSAGE = "Thing already exists"
DOMAIN_VALIDATION_MESSAGE = "Thing is not allowed"
INTERNAL_DETAIL = "SELECT * FROM employees -- E:/secret/path.py"
CUSTOM_RULE_MESSAGE = "Code must start with A"
CONFLICT_FIELD = "code"


class PayloadRequest(BaseModel):
    salary: int = Field(gt=0)


class CustomRuleRequest(BaseModel):
    code: str

    @field_validator("code")
    @classmethod
    def code_starts_with_a(cls, code: str) -> str:
        if not code.startswith("A"):
            raise ValueError(CUSTOM_RULE_MESSAGE)
        return code


def build_error_router() -> APIRouter:
    router = APIRouter(prefix=TEST_ROUTE_PREFIX)

    @router.post("/validation")
    def validate_payload(payload: PayloadRequest) -> PayloadRequest:
        return payload

    @router.post("/custom-rule")
    def validate_custom_rule(payload: CustomRuleRequest) -> CustomRuleRequest:
        return payload

    @router.get("/not-found")
    def raise_not_found() -> None:
        raise NotFoundError(NOT_FOUND_MESSAGE)

    @router.get("/conflict")
    def raise_conflict() -> None:
        raise ConflictError(CONFLICT_MESSAGE)

    @router.get("/conflict-on-field")
    def raise_conflict_on_field() -> None:
        raise ConflictError(CONFLICT_MESSAGE, field=CONFLICT_FIELD)

    @router.get("/domain-validation")
    def raise_domain_validation() -> None:
        raise DomainValidationError(DOMAIN_VALIDATION_MESSAGE)

    @router.get("/unexpected")
    def raise_unexpected() -> None:
        raise RuntimeError(INTERNAL_DETAIL)

    return router


@pytest.fixture
def error_app(settings: Settings) -> FastAPI:
    app = create_app(settings)
    app.include_router(build_error_router())
    return app


@pytest.fixture
def error_client(error_app: FastAPI) -> Iterator[TestClient]:
    # The 500 test needs the response the browser would get, not the re-raised exception.
    with TestClient(error_app, raise_server_exceptions=False) as test_client:
        yield test_client


def test_unknown_api_route_returns_json_404(error_client: TestClient) -> None:
    response = error_client.get("/api/does-not-exist")

    assert response.status_code == 404
    assert response.json() == {"error": "Not Found"}


def test_validation_error_returns_422_with_field_details(error_client: TestClient) -> None:
    response = error_client.post(f"{TEST_ROUTE_PREFIX}/validation", json={"salary": 0})

    assert response.status_code == 422
    assert response.json() == {
        "error": VALIDATION_FAILED,
        "details": [{"field": "salary", "message": "Input should be greater than 0"}],
    }


def test_custom_validation_rule_message_is_shown_without_a_prefix(
    error_client: TestClient,
) -> None:
    response = error_client.post(f"{TEST_ROUTE_PREFIX}/custom-rule", json={"code": "B1"})

    assert response.status_code == 422
    assert response.json()["details"] == [{"field": "code", "message": CUSTOM_RULE_MESSAGE}]


def test_not_found_error_returns_404_with_its_message(error_client: TestClient) -> None:
    response = error_client.get(f"{TEST_ROUTE_PREFIX}/not-found")

    assert response.status_code == 404
    assert response.json() == {"error": NOT_FOUND_MESSAGE}


def test_conflict_error_returns_409_with_its_message(error_client: TestClient) -> None:
    response = error_client.get(f"{TEST_ROUTE_PREFIX}/conflict")

    assert response.status_code == 409
    assert response.json() == {"error": CONFLICT_MESSAGE}


def test_domain_error_about_one_field_names_it_in_the_details(error_client: TestClient) -> None:
    response = error_client.get(f"{TEST_ROUTE_PREFIX}/conflict-on-field")

    assert response.status_code == 409
    assert response.json() == {
        "error": CONFLICT_MESSAGE,
        "details": [{"field": CONFLICT_FIELD, "message": CONFLICT_MESSAGE}],
    }


def test_domain_validation_error_returns_422_with_its_message(error_client: TestClient) -> None:
    response = error_client.get(f"{TEST_ROUTE_PREFIX}/domain-validation")

    assert response.status_code == 422
    assert response.json() == {"error": DOMAIN_VALIDATION_MESSAGE}


def test_unexpected_exception_returns_500_without_internals(error_client: TestClient) -> None:
    response = error_client.get(f"{TEST_ROUTE_PREFIX}/unexpected")

    assert response.status_code == 500
    assert response.json() == {"error": INTERNAL_SERVER_ERROR}
    assert INTERNAL_DETAIL not in response.text
