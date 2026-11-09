from fastapi import APIRouter, Request, Response, status

from app.api.client_ip import client_ip
from app.api.dependencies import (
    AuthServiceDependency,
    CurrentUserDependency,
    SessionTokenDependency,
    SettingsDependency,
)
from app.api.session_cookie import clear_session_cookie, set_session_cookie
from app.constants.route_constants import AUTH_PATH, CURRENT_USER_PATH, LOGIN_PATH, LOGOUT_PATH
from app.schemas.common.response_schema import DataResponse
from app.schemas.requests.login_request import LoginRequest
from app.schemas.resources.user_resource import UserResource

auth_router = APIRouter(prefix=AUTH_PATH, tags=["auth"])


@auth_router.post(LOGIN_PATH, response_model=DataResponse[UserResource])
def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    service: AuthServiceDependency,
    settings: SettingsDependency,
) -> DataResponse[UserResource]:
    result = service.login(body, client_ip(request, settings.trust_forwarded_for))
    set_session_cookie(response, result.session_token, settings)
    return DataResponse(data=UserResource.model_validate(result.user))


@auth_router.get(CURRENT_USER_PATH, response_model=DataResponse[UserResource])
def current_user(user: CurrentUserDependency) -> DataResponse[UserResource]:
    return DataResponse(data=UserResource.model_validate(user))


@auth_router.post(LOGOUT_PATH, status_code=status.HTTP_204_NO_CONTENT)
def logout(
    token: SessionTokenDependency, service: AuthServiceDependency, settings: SettingsDependency
) -> Response:
    service.logout(token)
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    clear_session_cookie(response, settings)
    return response
