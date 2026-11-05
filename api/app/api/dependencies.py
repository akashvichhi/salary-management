from datetime import timedelta
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.database import get_db
from app.models.user_model import UserModel
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.salary_insight_repository import SalaryInsightRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.employee_option_service import EmployeeOptionService
from app.services.employee_service import EmployeeService
from app.services.salary_insight_service import SalaryInsightService


def get_employee_service(session: Annotated[Session, Depends(get_db)]) -> EmployeeService:
    return EmployeeService(session, EmployeeRepository(session))


EmployeeServiceDependency = Annotated[EmployeeService, Depends(get_employee_service)]

# No dependencies of its own: the lists are constants.
EmployeeOptionServiceDependency = Annotated[EmployeeOptionService, Depends(EmployeeOptionService)]


def get_salary_insight_service(
    session: Annotated[Session, Depends(get_db)],
) -> SalaryInsightService:
    return SalaryInsightService(SalaryInsightRepository(session))


SalaryInsightServiceDependency = Annotated[
    SalaryInsightService, Depends(get_salary_insight_service)
]


def get_app_settings(request: Request) -> Settings:
    """The settings the app was created with (tests pass their own)."""
    settings: Settings = request.app.state.settings
    return settings


SettingsDependency = Annotated[Settings, Depends(get_app_settings)]


def get_auth_service(
    session: Annotated[Session, Depends(get_db)], settings: SettingsDependency
) -> AuthService:
    return AuthService(
        session,
        UserRepository(session),
        SessionRepository(session),
        session_ttl=timedelta(hours=settings.session_ttl_hours),
    )


AuthServiceDependency = Annotated[AuthService, Depends(get_auth_service)]


def get_current_user(
    request: Request, service: AuthServiceDependency, settings: SettingsDependency
) -> UserModel:
    return service.current_user(request.cookies.get(settings.session_cookie_name))


CurrentUserDependency = Annotated[UserModel, Depends(get_current_user)]
