import math

from pydantic import BaseModel

from app.schemas.requests.pagination_request import PaginationRequest


class DataResponse[T](BaseModel):
    data: T


class PaginationMeta(BaseModel):
    total_count: int
    current_page: int
    per_page: int
    total_pages: int


class PaginatedResponse[T](BaseModel):
    data: list[T]
    meta: PaginationMeta

    @classmethod
    def create(
        cls, items: list[T], total_count: int, pagination: PaginationRequest
    ) -> "PaginatedResponse[T]":
        return cls(
            data=items,
            meta=PaginationMeta(
                total_count=total_count,
                current_page=pagination.page,
                per_page=pagination.per_page,
                total_pages=math.ceil(total_count / pagination.per_page),
            ),
        )


class FieldError(BaseModel):
    field: str
    message: str


class ErrorResponse(BaseModel):
    error: str
    details: list[FieldError] | None = None
