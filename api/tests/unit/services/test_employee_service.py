from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.employee_model import EmployeeModel
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.requests.employee_request import EmployeeListRequest, EmployeeUpdateRequest
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
    assert EmployeeRepository(session).find_active_by_email("new.person@acme.com") is not None


def test_create_employee_rejects_duplicate_email(
    service: EmployeeService, session: Session
) -> None:
    session.add(build_employee(email="asha.rao@acme.com"))
    session.commit()

    with pytest.raises(ConflictError):
        service.create_employee(build_create_request(email="asha.rao@acme.com"))


class RepositoryThatMissesTheDuplicate(EmployeeRepository):
    """Simulates another request saving the same email between our check and our commit."""

    def find_active_by_email(self, email: str) -> EmployeeModel | None:
        return None


def test_create_employee_turns_a_unique_index_violation_into_a_conflict(session: Session) -> None:
    session.add(build_employee(email="asha.rao@acme.com"))
    session.commit()
    service = EmployeeService(session, RepositoryThatMissesTheDuplicate(session))

    with pytest.raises(ConflictError):
        service.create_employee(build_create_request(email="asha.rao@acme.com"))


def test_get_employee_returns_the_employee(service: EmployeeService, session: Session) -> None:
    employee = build_employee()
    session.add(employee)
    session.commit()

    found = service.get_employee(employee.id)

    assert found.id == employee.id
    assert found.full_name == employee.full_name


def test_get_employee_raises_not_found_for_an_unknown_id(service: EmployeeService) -> None:
    with pytest.raises(NotFoundError):
        service.get_employee(999)


def saved_employee(session: Session, **overrides: object) -> EmployeeModel:
    employee = build_employee(**overrides)
    session.add(employee)
    session.commit()
    return employee


def update(**fields: object) -> EmployeeUpdateRequest:
    return EmployeeUpdateRequest.model_validate(fields)


def test_update_employee_changes_only_the_sent_fields(
    service: EmployeeService, session: Session
) -> None:
    employee = saved_employee(session, full_name="Asha Rao", salary=Decimal("85000.00"))

    updated = service.update_employee(employee.id, update(salary="90000.00"))

    assert updated.salary == Decimal("90000.00")
    assert updated.full_name == "Asha Rao"


def test_update_employee_rejects_another_employees_email(
    service: EmployeeService, session: Session
) -> None:
    saved_employee(session, email="taken@acme.com")
    employee = saved_employee(session, email="asha.rao@acme.com")

    with pytest.raises(ConflictError):
        service.update_employee(employee.id, update(email="taken@acme.com"))


def test_update_employee_allows_keeping_the_same_email(
    service: EmployeeService, session: Session
) -> None:
    employee = saved_employee(session, email="asha.rao@acme.com")

    updated = service.update_employee(employee.id, update(email="asha.rao@acme.com"))

    assert updated.email == "asha.rao@acme.com"


def test_update_employee_raises_not_found_for_an_unknown_id(service: EmployeeService) -> None:
    with pytest.raises(NotFoundError):
        service.update_employee(999, update(salary="90000.00"))


def test_delete_employee_keeps_the_row_but_marks_it_inactive(
    service: EmployeeService, session: Session
) -> None:
    employee = saved_employee(session)

    service.delete_employee(employee.id)

    session.refresh(employee)
    assert employee.is_active is False


def test_a_deleted_employee_is_not_found(service: EmployeeService, session: Session) -> None:
    employee = saved_employee(session)
    service.delete_employee(employee.id)

    with pytest.raises(NotFoundError):
        service.get_employee(employee.id)
    with pytest.raises(NotFoundError):
        service.update_employee(employee.id, update(salary="90000.00"))
    with pytest.raises(NotFoundError):
        service.delete_employee(employee.id)


def test_delete_employee_raises_not_found_for_an_unknown_id(service: EmployeeService) -> None:
    with pytest.raises(NotFoundError):
        service.delete_employee(999)


def test_a_deleted_employees_email_can_be_used_again(
    service: EmployeeService, session: Session
) -> None:
    employee = saved_employee(session, email="asha.rao@acme.com")
    service.delete_employee(employee.id)

    created = service.create_employee(build_create_request(email="asha.rao@acme.com"))

    assert created.id != employee.id


def test_list_employees_returns_the_page_with_its_meta(
    service: EmployeeService, session: Session
) -> None:
    for number in range(3):
        saved_employee(session, full_name=f"Person {number}", email=f"p{number}@acme.com")

    response = service.list_employees(EmployeeListRequest(page=1, per_page=2))

    assert [employee.full_name for employee in response.data] == ["Person 0", "Person 1"]
    assert response.meta.total_count == 3
    assert response.meta.total_pages == 2


def test_list_employees_past_the_last_page_is_empty_with_the_real_meta(
    service: EmployeeService, session: Session
) -> None:
    saved_employee(session)

    response = service.list_employees(EmployeeListRequest(page=5, per_page=20))

    assert response.data == []
    assert response.meta.total_count == 1
    assert response.meta.current_page == 5
