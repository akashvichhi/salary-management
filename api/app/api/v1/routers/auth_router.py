from fastapi import APIRouter, Response

from app.api.dependencies import AuthServiceDependency, SettingsDependency
from app.api.session_cookie import set_session_cookie
from app.constants.route_constants import AUTH_PATH, LOGIN_PATH
from app.schemas.common.response_schema import DataResponse
from app.schemas.requests.login_request import LoginRequest
from app.schemas.resources.user_resource import UserResource

auth_router = APIRouter(prefix=AUTH_PATH, tags=["auth"])


@auth_router.post(LOGIN_PATH, response_model=DataResponse[UserResource])
def login(
    body: LoginRequest,
    response: Response,
    service: AuthServiceDependency,
    settings: SettingsDependency,
) -> DataResponse[UserResource]:
    result = service.login(body)
    set_session_cookie(response, result.session_token, settings)
    return DataResponse(data=UserResource.model_validate(result.user))
