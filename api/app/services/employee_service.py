from collections.abc import Generator
from contextlib import contextmanager

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.constants.messages import EMPLOYEE_EMAIL_TAKEN, EMPLOYEE_NOT_FOUND
from app.core.exceptions import ConflictError, NotFoundError
from app.models.employee_model import EmployeeModel
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.common.response_schema import PaginatedResponse
from app.schemas.requests.employee_request import (
    EmployeeCreateRequest,
    EmployeeListRequest,
    EmployeeUpdateRequest,
)
from app.schemas.resources.employee_resource import EmployeeResource


class EmployeeService:
    def __init__(self, session: Session, repository: EmployeeRepository) -> None:
        self.session = session
        self.repository = repository

    def create_employee(self, request: EmployeeCreateRequest) -> EmployeeResource:
        self._ensure_email_is_free(request.email)
        with self._saving():
            employee = self.repository.add(EmployeeModel(**request.model_dump()))
        return EmployeeResource.model_validate(employee)

    def list_employees(self, request: EmployeeListRequest) -> PaginatedResponse[EmployeeResource]:
        employees, total_count = self.repository.list_active(request)
        items = [EmployeeResource.model_validate(employee) for employee in employees]
        return PaginatedResponse[EmployeeResource].create(items, total_count, request)

    def get_employee(self, employee_id: int) -> EmployeeResource:
        return EmployeeResource.model_validate(self._find_or_raise(employee_id))

    def update_employee(self, employee_id: int, request: EmployeeUpdateRequest) -> EmployeeResource:
        employee = self._find_or_raise(employee_id)
        changes = request.model_dump(exclude_unset=True)
        if "email" in changes:
            self._ensure_email_is_free(changes["email"], allowed_owner=employee)
        with self._saving():
            for field, value in changes.items():
                setattr(employee, field, value)
        return EmployeeResource.model_validate(employee)

    def delete_employee(self, employee_id: int) -> None:
        employee = self._find_or_raise(employee_id)
        with self._saving():
            employee.is_active = False

    def _find_or_raise(self, employee_id: int) -> EmployeeModel:
        employee = self.repository.find_active_by_id(employee_id)
        if employee is None:
            raise NotFoundError(EMPLOYEE_NOT_FOUND)
        return employee

    def _ensure_email_is_free(self, email: str, allowed_owner: EmployeeModel | None = None) -> None:
        owner = self.repository.find_active_by_email(email)
        if owner is not None and owner is not allowed_owner:
            raise ConflictError(EMPLOYEE_EMAIL_TAKEN)

    @contextmanager
    def _saving(self) -> Generator[None]:
        """Commits the work done inside it, as one transaction."""
        try:
            yield
            self.session.commit()
        except IntegrityError as error:
            # The unique email index is the only constraint a valid request can break:
            # another request saved the same email after our check above.
            self.session.rollback()
            raise ConflictError(EMPLOYEE_EMAIL_TAKEN) from error
