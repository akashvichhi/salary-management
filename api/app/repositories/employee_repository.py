from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.employee_model import EmployeeModel


def active_employees() -> Select[EmployeeModel]:
    """Every query starts here, so a soft-deleted employee can't leak into a result."""
    return select(EmployeeModel).where(EmployeeModel.is_active.is_(True))


class EmployeeRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, employee: EmployeeModel) -> EmployeeModel:
        self.session.add(employee)
        self.session.flush()
        return employee

    def find_active_by_id(self, employee_id: int) -> EmployeeModel | None:
        return self.session.scalar(active_employees().where(EmployeeModel.id == employee_id))

    def find_active_by_email(self, email: str) -> EmployeeModel | None:
        return self.session.scalar(active_employees().where(EmployeeModel.email == email))
