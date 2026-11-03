from sqlalchemy import ColumnElement, Select, func, or_, select, true
from sqlalchemy.orm import Session

from app.models.employee_model import EmployeeModel
from app.schemas.requests.employee_request import EmployeeListRequest


def is_active_employee() -> ColumnElement[bool]:
    """Every query filters on this, so a soft-deleted employee can't leak into a result.

    `= 1`, not `IS 1`: SQLite uses the partial email index only when the query repeats
    the index's own condition (`is_active = 1`) exactly.
    """
    return EmployeeModel.is_active == true()


def active_employees() -> Select[EmployeeModel]:
    return select(EmployeeModel).where(is_active_employee())


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

    def list_active(self, request: EmployeeListRequest) -> tuple[list[EmployeeModel], int]:
        query = self._filtered(request)
        total_count = self.session.scalar(select(func.count()).select_from(query.subquery()))
        sort_column = getattr(EmployeeModel, request.sort_field.value)
        order = sort_column.desc() if request.sort_descending else sort_column.asc()
        page = (
            query.order_by(order, EmployeeModel.id)  # id breaks ties, so pages never overlap
            .offset(request.offset)
            .limit(request.per_page)
        )
        return list(self.session.scalars(page)), total_count or 0

    @staticmethod
    def _filtered(request: EmployeeListRequest) -> Select[EmployeeModel]:
        query = active_employees()
        exact_filters = {
            EmployeeModel.country: request.country,
            EmployeeModel.job_title: request.job_title,
            EmployeeModel.department: request.department,
        }
        for column, value in exact_filters.items():
            if value is not None:
                query = query.where(column == value)
        if request.search is not None:
            # autoescape makes % and _ in the search text match literally.
            query = query.where(
                or_(
                    EmployeeModel.full_name.icontains(request.search, autoescape=True),
                    EmployeeModel.email.icontains(request.search, autoescape=True),
                )
            )
        return query
