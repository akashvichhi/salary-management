from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.salary_insight_repository import SalaryInsightRepository
from app.services.employee_option_service import EmployeeOptionService
from app.services.employee_service import EmployeeService
from app.services.salary_insight_service import SalaryInsightService


def get_employee_service(session: Annotated[Session, Depends(get_db)]) -> EmployeeService:
    return EmployeeService(session, EmployeeRepository(session))


EmployeeServiceDependency = Annotated[EmployeeService, Depends(get_employee_service)]

# No dependencies of its own: the lists are constants.
EmployeeOptionServiceDependency = Annotated[EmployeeOptionService, Depends(EmployeeOptionService)]


def get_salary_insight_service(
    session: Annotated[Session, Depends(get_db)],
) -> SalaryInsightService:
    return SalaryInsightService(SalaryInsightRepository(session))


SalaryInsightServiceDependency = Annotated[
    SalaryInsightService, Depends(get_salary_insight_service)
]
