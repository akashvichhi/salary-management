"""The session cookie: HttpOnly, SameSite=Lax, Path=/, and Secure outside local development."""

from typing import Final, Literal

from fastapi import Response

from app.core.config import Settings

SECONDS_PER_HOUR = 3600
COOKIE_PATH = "/"
COOKIE_SAME_SITE: Final[Literal["lax"]] = "lax"


def set_session_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=settings.session_ttl_hours * SECONDS_PER_HOUR,
        path=COOKIE_PATH,
        secure=settings.cookie_secure,
        httponly=True,
        samesite=COOKIE_SAME_SITE,
    )


def clear_session_cookie(response: Response, settings: Settings) -> None:
    # The same attributes as when it was set, or the browser keeps the original cookie.
    response.delete_cookie(
        key=settings.session_cookie_name,
        path=COOKIE_PATH,
        secure=settings.cookie_secure,
        httponly=True,
        samesite=COOKIE_SAME_SITE,
    )
