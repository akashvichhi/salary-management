from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.constants.messages import INVALID_CREDENTIALS
from app.core.config import Settings
from app.core.database import create_database_engine, create_session_factory
from app.core.security import hash_password, hash_session_token
from app.main import create_app
from app.models.session_model import SessionModel
from app.models.user_model import UserModel

LOGIN_URL = "/api/v1/auth/login"
HR_MANAGER_EMAIL = "hr@acme.com"
HR_MANAGER_PASSWORD = "correct horse battery staple"
SESSION_TTL_SECONDS = 8 * 60 * 60
INVALID_CREDENTIALS_RESPONSE = {"error": INVALID_CREDENTIALS}


def login_payload(
    email: str = HR_MANAGER_EMAIL, password: str = HR_MANAGER_PASSWORD
) -> dict[str, str]:
    return {"email": email, "password": password}


@pytest.fixture
def hr_manager(settings: Settings) -> UserModel:
    engine = create_database_engine(settings.database_url)
    with create_session_factory(engine)() as db_session:
        user = UserModel(email=HR_MANAGER_EMAIL, password_hash=hash_password(HR_MANAGER_PASSWORD))
        db_session.add(user)
        db_session.commit()
    engine.dispose()
    return user


def stored_sessions(settings: Settings) -> list[SessionModel]:
    engine = create_database_engine(settings.database_url)
    with create_session_factory(engine)() as db_session:
        rows = list(db_session.scalars(select(SessionModel)))
    engine.dispose()
    return rows


def client_with(settings: Settings, **overrides: object) -> TestClient:
    return TestClient(create_app(settings.model_copy(update=overrides)))


@pytest.fixture
def secure_client(settings: Settings) -> Iterator[TestClient]:
    with client_with(settings, cookie_secure=True) as test_client:
        yield test_client


@pytest.fixture
def local_client(settings: Settings) -> Iterator[TestClient]:
    with client_with(settings, cookie_secure=False) as test_client:
        yield test_client


@pytest.mark.usefixtures("hr_manager")
def test_login_returns_the_user_without_any_token(client: TestClient) -> None:
    response = client.post(LOGIN_URL, json=login_payload())

    assert response.status_code == 200
    user = response.json()["data"]
    assert set(user) == {"id", "email"}
    assert user["email"] == HR_MANAGER_EMAIL


@pytest.mark.usefixtures("hr_manager")
def test_login_sets_an_http_only_same_site_lax_session_cookie(secure_client: TestClient) -> None:
    response = secure_client.post(LOGIN_URL, json=login_payload())

    cookie = response.headers["set-cookie"]
    attributes = {part.strip().lower() for part in cookie.split(";")}
    assert "httponly" in attributes
    assert "samesite=lax" in attributes
    assert "path=/" in attributes
    assert f"max-age={SESSION_TTL_SECONDS}" in attributes
    assert "secure" in attributes


@pytest.mark.usefixtures("hr_manager")
def test_the_session_cookie_is_not_secure_when_disabled_for_local_development(
    local_client: TestClient,
) -> None:
    response = local_client.post(LOGIN_URL, json=login_payload())

    attributes = {part.strip().lower() for part in response.headers["set-cookie"].split(";")}
    assert "secure" not in attributes


@pytest.mark.usefixtures("hr_manager")
def test_the_database_keeps_only_a_hash_of_the_session_id(
    local_client: TestClient, settings: Settings
) -> None:
    response = local_client.post(LOGIN_URL, json=login_payload())

    session_id = response.cookies[settings.session_cookie_name]
    [stored] = stored_sessions(settings)
    assert stored.token_hash == hash_session_token(session_id)
    assert stored.token_hash != session_id


@pytest.mark.usefixtures("hr_manager")
def test_every_login_gets_a_new_session_id(local_client: TestClient, settings: Settings) -> None:
    first = local_client.post(LOGIN_URL, json=login_payload())
    second = local_client.post(LOGIN_URL, json=login_payload())

    name = settings.session_cookie_name
    assert first.cookies[name] != second.cookies[name]


@pytest.mark.usefixtures("hr_manager")
def test_login_ignores_the_case_and_spaces_of_the_email(client: TestClient) -> None:
    response = client.post(LOGIN_URL, json=login_payload(email="  HR@Acme.com "))

    assert response.status_code == 200


@pytest.mark.usefixtures("hr_manager")
def test_a_wrong_email_and_a_wrong_password_get_the_same_401(client: TestClient) -> None:
    wrong_email = client.post(LOGIN_URL, json=login_payload(email="nobody@acme.com"))
    wrong_password = client.post(LOGIN_URL, json=login_payload(password="wrong password"))

    assert wrong_email.status_code == wrong_password.status_code == 401
    assert wrong_email.json() == wrong_password.json() == INVALID_CREDENTIALS_RESPONSE
    assert "set-cookie" not in wrong_email.headers
    assert "set-cookie" not in wrong_password.headers


def test_login_rejects_an_empty_password(client: TestClient) -> None:
    response = client.post(LOGIN_URL, json=login_payload(password=""))

    assert response.status_code == 422
    assert [detail["field"] for detail in response.json()["details"]] == ["password"]
