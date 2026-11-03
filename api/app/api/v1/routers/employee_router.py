from fastapi import APIRouter, Response, status

from app.api.dependencies import EmployeeServiceDependency
from app.constants.route_constants import EMPLOYEES_PATH
from app.schemas.common.response_schema import DataResponse
from app.schemas.requests.employee_request import EmployeeCreateRequest, EmployeeUpdateRequest
from app.schemas.resources.employee_resource import EmployeeResource

employee_router = APIRouter(prefix=EMPLOYEES_PATH, tags=["employees"])


@employee_router.get("/{employee_id}", response_model=DataResponse[EmployeeResource])
def get_employee(
    employee_id: int, service: EmployeeServiceDependency
) -> DataResponse[EmployeeResource]:
    return DataResponse(data=service.get_employee(employee_id))


@employee_router.post(
    "", status_code=status.HTTP_201_CREATED, response_model=DataResponse[EmployeeResource]
)
def create_employee(
    request: EmployeeCreateRequest, service: EmployeeServiceDependency
) -> DataResponse[EmployeeResource]:
    return DataResponse(data=service.create_employee(request))


@employee_router.patch("/{employee_id}", response_model=DataResponse[EmployeeResource])
def update_employee(
    employee_id: int, request: EmployeeUpdateRequest, service: EmployeeServiceDependency
) -> DataResponse[EmployeeResource]:
    return DataResponse(data=service.update_employee(employee_id, request))


@employee_router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: int, service: EmployeeServiceDependency) -> Response:
    service.delete_employee(employee_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
