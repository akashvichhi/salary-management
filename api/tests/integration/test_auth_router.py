from collections.abc import Iterator
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.constants.messages import INVALID_CREDENTIALS, NOT_AUTHENTICATED
from app.core.config import Settings
from app.core.database import create_database_engine, create_session_factory
from app.core.security import generate_session_token, hash_session_token
from app.main import create_app
from app.models.base_model import now_in_app_timezone
from app.models.session_model import SessionModel
from app.models.user_model import UserModel
from tests.factories import HR_MANAGER_EMAIL, login_payload

LOGIN_URL = "/api/v1/auth/login"
CURRENT_USER_URL = "/api/v1/auth/me"
LOGOUT_URL = "/api/v1/auth/logout"
SESSION_TTL_SECONDS = 8 * 60 * 60
INVALID_CREDENTIALS_RESPONSE = {"error": INVALID_CREDENTIALS}
NOT_AUTHENTICATED_RESPONSE = {"error": NOT_AUTHENTICATED}
# One route per protected router, so a router left unprotected fails here.
PROTECTED_URLS = [
    "/api/v1/employees",
    "/api/v1/employee-options",
    "/api/v1/salary-insights/overview",
]


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
    client: TestClient,
) -> None:
    response = client.post(LOGIN_URL, json=login_payload())

    attributes = {part.strip().lower() for part in response.headers["set-cookie"].split(";")}
    assert "secure" not in attributes


@pytest.mark.usefixtures("hr_manager")
def test_the_database_keeps_only_a_hash_of_the_session_id(
    client: TestClient, settings: Settings
) -> None:
    response = client.post(LOGIN_URL, json=login_payload())

    session_id = response.cookies[settings.session_cookie_name]
    [stored] = stored_sessions(settings)
    assert stored.token_hash == hash_session_token(session_id)
    assert stored.token_hash != session_id


@pytest.mark.usefixtures("hr_manager")
def test_every_login_gets_a_new_session_id(client: TestClient, settings: Settings) -> None:
    first = client.post(LOGIN_URL, json=login_payload())
    second = client.post(LOGIN_URL, json=login_payload())

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


def add_session(settings: Settings, user: UserModel, expires_in: timedelta) -> str:
    """Stores a session for the user directly, and returns the token its cookie would hold."""
    token = generate_session_token()
    engine = create_database_engine(settings.database_url)
    with create_session_factory(engine)() as db_session:
        db_session.add(
            SessionModel(
                token_hash=hash_session_token(token),
                user_id=user.id,
                expires_at=now_in_app_timezone() + expires_in,
            )
        )
        db_session.commit()
    engine.dispose()
    return token


@pytest.mark.parametrize("url", PROTECTED_URLS)
def test_a_protected_route_returns_401_without_a_session_cookie(
    client: TestClient, url: str
) -> None:
    response = client.get(url)

    assert response.status_code == 401
    assert response.json() == NOT_AUTHENTICATED_RESPONSE


@pytest.mark.parametrize("url", PROTECTED_URLS)
def test_a_protected_route_works_with_a_session(authenticated_client: TestClient, url: str) -> None:
    assert authenticated_client.get(url).status_code == 200


def test_an_unknown_session_id_returns_401(client: TestClient, settings: Settings) -> None:
    client.cookies.set(settings.session_cookie_name, generate_session_token())

    response = client.get(PROTECTED_URLS[0])

    assert response.status_code == 401
    assert response.json() == NOT_AUTHENTICATED_RESPONSE


def test_an_expired_session_returns_401_and_is_deleted(
    client: TestClient, settings: Settings, hr_manager: UserModel
) -> None:
    token = add_session(settings, hr_manager, expires_in=-timedelta(seconds=1))
    client.cookies.set(settings.session_cookie_name, token)

    response = client.get(PROTECTED_URLS[0])

    assert response.status_code == 401
    assert response.json() == NOT_AUTHENTICATED_RESPONSE
    assert stored_sessions(settings) == []


def test_a_session_works_until_it_expires(
    client: TestClient, settings: Settings, hr_manager: UserModel
) -> None:
    token = add_session(settings, hr_manager, expires_in=timedelta(minutes=1))
    client.cookies.set(settings.session_cookie_name, token)

    assert client.get(PROTECTED_URLS[0]).status_code == 200


def test_the_current_user_is_the_logged_in_hr_manager(authenticated_client: TestClient) -> None:
    response = authenticated_client.get(CURRENT_USER_URL)

    assert response.status_code == 200
    assert response.json()["data"]["email"] == HR_MANAGER_EMAIL


def test_the_current_user_returns_401_when_not_logged_in(client: TestClient) -> None:
    response = client.get(CURRENT_USER_URL)

    assert response.status_code == 401
    assert response.json() == NOT_AUTHENTICATED_RESPONSE


def test_logout_returns_204_and_clears_the_cookie(
    authenticated_client: TestClient, settings: Settings
) -> None:
    response = authenticated_client.post(LOGOUT_URL)

    assert response.status_code == 204
    assert response.content == b""
    cookie = response.headers["set-cookie"].lower()
    assert cookie.startswith(f"{settings.session_cookie_name}=")
    assert "max-age=0" in cookie
    assert "httponly" in cookie


def test_logout_ends_the_session_on_the_server(
    authenticated_client: TestClient, settings: Settings
) -> None:
    session_id = authenticated_client.cookies[settings.session_cookie_name]

    authenticated_client.post(LOGOUT_URL)
    # Sending the old session ID again, as a copied cookie would.
    authenticated_client.cookies.set(settings.session_cookie_name, session_id)

    assert authenticated_client.get(CURRENT_USER_URL).status_code == 401
    assert stored_sessions(settings) == []


def test_logout_without_a_session_still_succeeds(client: TestClient) -> None:
    assert client.post(LOGOUT_URL).status_code == 204
