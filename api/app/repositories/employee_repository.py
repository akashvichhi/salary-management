from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.employee_model import EmployeeModel


class EmployeeRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, employee: EmployeeModel) -> EmployeeModel:
        self.session.add(employee)
        self.session.flush()
        return employee

    def find_by_email(self, email: str) -> EmployeeModel | None:
        return self.session.scalar(select(EmployeeModel).where(EmployeeModel.email == email))
