from fastapi import APIRouter, status

from app.api.dependencies import EmployeeServiceDependency
from app.constants.route_constants import EMPLOYEES_PATH
from app.schemas.common.response_schema import DataResponse
from app.schemas.requests.employee_request import EmployeeCreateRequest
from app.schemas.resources.employee_resource import EmployeeResource

employee_router = APIRouter(prefix=EMPLOYEES_PATH, tags=["employees"])


@employee_router.post(
    "", status_code=status.HTTP_201_CREATED, response_model=DataResponse[EmployeeResource]
)
def create_employee(
    request: EmployeeCreateRequest, service: EmployeeServiceDependency
) -> DataResponse[EmployeeResource]:
    return DataResponse(data=service.create_employee(request))
