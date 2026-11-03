from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.employee_repository import EmployeeRepository
from app.services.employee_service import EmployeeService


def get_employee_service(session: Annotated[Session, Depends(get_db)]) -> EmployeeService:
    return EmployeeService(session, EmployeeRepository(session))


EmployeeServiceDependency = Annotated[EmployeeService, Depends(get_employee_service)]
