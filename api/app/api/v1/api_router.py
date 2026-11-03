from fastapi import APIRouter

from app.api.v1.routers.employee_router import employee_router
from app.constants.route_constants import API_V1_PREFIX

api_v1_router = APIRouter(prefix=API_V1_PREFIX)
api_v1_router.include_router(employee_router)
