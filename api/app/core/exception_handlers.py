import logging
from collections.abc import Mapping
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.constants.messages import INTERNAL_SERVER_ERROR, VALIDATION_FAILED
from app.core.exceptions import (
    ConflictError,
    DomainError,
    DomainValidationError,
    NotFoundError,
    UnauthenticatedError,
)
from app.schemas.common.response_schema import ErrorResponse, FieldError

logger = logging.getLogger(__name__)

# A new domain error gets its status code here, without touching the handlers.
DOMAIN_ERROR_STATUS_CODES: dict[type[DomainError], int] = {
    UnauthenticatedError: status.HTTP_401_UNAUTHORIZED,
    NotFoundError: status.HTTP_404_NOT_FOUND,
    ConflictError: status.HTTP_409_CONFLICT,
    DomainValidationError: status.HTTP_422_UNPROCESSABLE_CONTENT,
}

# The first item of a validation error location is where the value came from
# ("body", "query", "path"); the rest is the field name the client sent.
LOCATION_SOURCE_LENGTH = 1
CUSTOM_RULE_ERROR_TYPE = "value_error"


def status_code_for(exc: DomainError) -> int:
    return next(
        DOMAIN_ERROR_STATUS_CODES[error_type]
        for error_type in type(exc).__mro__
        if error_type in DOMAIN_ERROR_STATUS_CODES
    )


def error_response(
    status_code: int,
    message: str,
    details: list[FieldError] | None = None,
    headers: Mapping[str, str] | None = None,
) -> JSONResponse:
    body = ErrorResponse(error=message, details=details)
    return JSONResponse(
        status_code=status_code,
        content=body.model_dump(exclude_none=True),
        headers=headers,
    )


def to_field_error(error: Mapping[str, Any]) -> FieldError:
    location: tuple[str | int, ...] = error["loc"]
    field = ".".join(str(part) for part in location[LOCATION_SOURCE_LENGTH:])
    return FieldError(field=field, message=field_error_message(error))


def field_error_message(error: Mapping[str, Any]) -> str:
    # Our own validators raise ValueError; Pydantic would show "Value error, <message>".
    if error["type"] == CUSTOM_RULE_ERROR_TYPE:
        return str(error["ctx"]["error"])
    return str(error["msg"])


def handle_request_validation_error(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, RequestValidationError)
    details = [to_field_error(error) for error in exc.errors()]
    return error_response(status.HTTP_422_UNPROCESSABLE_CONTENT, VALIDATION_FAILED, details)


def handle_http_exception(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, StarletteHTTPException)
    return error_response(exc.status_code, str(exc.detail), headers=exc.headers)


def handle_domain_error(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, DomainError)
    details = [FieldError(field=exc.field, message=exc.message)] if exc.field else None
    return error_response(status_code_for(exc), exc.message, details)


def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    # Method and path only: request bodies may hold salaries or names.
    logger.error("Unhandled error on %s %s", request.method, request.url.path, exc_info=exc)
    return error_response(status.HTTP_500_INTERNAL_SERVER_ERROR, INTERNAL_SERVER_ERROR)


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(RequestValidationError, handle_request_validation_error)
    app.add_exception_handler(StarletteHTTPException, handle_http_exception)
    app.add_exception_handler(DomainError, handle_domain_error)
    app.add_exception_handler(Exception, handle_unexpected_error)
