from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError
from app.models.employee_model import EmployeeModel
from app.repositories.employee_repository import EmployeeRepository
from app.services.employee_service import EmployeeService
from tests.factories import build_create_request, build_employee


@pytest.fixture
def service(session: Session) -> EmployeeService:
    return EmployeeService(session, EmployeeRepository(session))


def test_create_employee_saves_and_returns_the_employee(
    service: EmployeeService, session: Session
) -> None:
    created = service.create_employee(build_create_request(email="new.person@acme.com"))

    assert created.id is not None
    assert created.email == "new.person@acme.com"
    assert created.salary == Decimal("85000.00")
    assert EmployeeRepository(session).find_by_email("new.person@acme.com") is not None


def test_create_employee_rejects_duplicate_email(
    service: EmployeeService, session: Session
) -> None:
    session.add(build_employee(email="asha.rao@acme.com"))
    session.commit()

    with pytest.raises(ConflictError):
        service.create_employee(build_create_request(email="asha.rao@acme.com"))


class RepositoryThatMissesTheDuplicate(EmployeeRepository):
    """Simulates another request saving the same email between our check and our commit."""

    def find_by_email(self, email: str) -> EmployeeModel | None:
        return None


def test_create_employee_turns_a_unique_index_violation_into_a_conflict(session: Session) -> None:
    session.add(build_employee(email="asha.rao@acme.com"))
    session.commit()
    service = EmployeeService(session, RepositoryThatMissesTheDuplicate(session))

    with pytest.raises(ConflictError):
        service.create_employee(build_create_request(email="asha.rao@acme.com"))
