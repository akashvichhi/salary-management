from fastapi import APIRouter

from app.api.dependencies import EmployeeOptionServiceDependency
from app.constants.route_constants import EMPLOYEE_OPTIONS_PATH
from app.schemas.common.response_schema import DataResponse
from app.schemas.resources.employee_option_resource import EmployeeOptionsResource

employee_option_router = APIRouter(prefix=EMPLOYEE_OPTIONS_PATH, tags=["employees"])


@employee_option_router.get("", response_model=DataResponse[EmployeeOptionsResource])
def get_employee_options(
    service: EmployeeOptionServiceDependency,
) -> DataResponse[EmployeeOptionsResource]:
    return DataResponse(data=service.get_options())
