from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.api.v1.routers.auth_router import auth_router
from app.api.v1.routers.employee_option_router import employee_option_router
from app.api.v1.routers.employee_router import employee_router
from app.api.v1.routers.salary_insight_router import salary_insight_router
from app.constants.route_constants import API_V1_PREFIX

# Every router added here needs a session, so a new endpoint can't be left open by accident.
protected_router = APIRouter(dependencies=[Depends(get_current_user)])
protected_router.include_router(employee_router)
protected_router.include_router(employee_option_router)
protected_router.include_router(salary_insight_router)

api_v1_router = APIRouter(prefix=API_V1_PREFIX)
# The only routes without a session check: login itself, and the auth routes that check it.
api_v1_router.include_router(auth_router)
api_v1_router.include_router(protected_router)
