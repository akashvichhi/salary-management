from typing import Annotated

from fastapi import APIRouter, Path, Query, Response, status

from app.api.dependencies import EmployeeServiceDependency
from app.constants.route_constants import EMPLOYEES_PATH
from app.core.database import SQLITE_MAX_INTEGER
from app.schemas.common.response_schema import DataResponse, PaginatedResponse
from app.schemas.requests.employee_request import (
    EmployeeCreateRequest,
    EmployeeListRequest,
    EmployeeUpdateRequest,
)
from app.schemas.resources.employee_resource import EmployeeResource

employee_router = APIRouter(prefix=EMPLOYEES_PATH, tags=["employees"])

EmployeeId = Annotated[int, Path(le=SQLITE_MAX_INTEGER)]


@employee_router.get("", response_model=PaginatedResponse[EmployeeResource])
def list_employees(
    request: Annotated[EmployeeListRequest, Query()], service: EmployeeServiceDependency
) -> PaginatedResponse[EmployeeResource]:
    return service.list_employees(request)


@employee_router.get("/{employee_id}", response_model=DataResponse[EmployeeResource])
def get_employee(
    employee_id: EmployeeId, service: EmployeeServiceDependency
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
    employee_id: EmployeeId, request: EmployeeUpdateRequest, service: EmployeeServiceDependency
) -> DataResponse[EmployeeResource]:
    return DataResponse(data=service.update_employee(employee_id, request))


@employee_router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: EmployeeId, service: EmployeeServiceDependency) -> Response:
    service.delete_employee(employee_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
