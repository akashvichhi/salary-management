class DomainError(Exception):
    """Base for errors raised by services. Carries a message that is safe to show the user.

    `field` names the request field the error is about (e.g. a taken email), so the client can
    show the message on that input.
    """

    def __init__(self, message: str, field: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.field = field


class UnauthenticatedError(DomainError):
    """Not logged in, or the session is unknown or expired."""


class TooManyRequestsError(DomainError):
    pass


class NotFoundError(DomainError):
    pass


class ConflictError(DomainError):
    pass


class DomainValidationError(DomainError):
    pass
