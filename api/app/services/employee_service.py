from collections.abc import Generator
from contextlib import contextmanager

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.constants.messages import EMPLOYEE_EMAIL_TAKEN
from app.core.exceptions import ConflictError
from app.models.employee_model import EmployeeModel
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.requests.employee_request import EmployeeCreateRequest
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

    def _ensure_email_is_free(self, email: str) -> None:
        if self.repository.find_by_email(email) is not None:
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
