from pydantic import BaseModel


class DataResponse[T](BaseModel):
    data: T


class FieldError(BaseModel):
    field: str
    message: str


class ErrorResponse(BaseModel):
    error: str
    details: list[FieldError] | None = None
