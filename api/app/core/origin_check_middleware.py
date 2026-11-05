"""CSRF protection: a write request from another site's page is rejected before it reaches a route.

The session cookie is SameSite=Lax, and this is the second layer: browsers send an `Origin`
header on every cross-site POST, PATCH, PUT and DELETE, so a write whose origin is neither this
site nor an allowed one (the Vite dev server) is refused.
"""

from urllib.parse import urlsplit

from fastapi import status
from starlette.datastructures import Headers
from starlette.types import ASGIApp, Receive, Scope, Send

from app.constants.messages import ORIGIN_NOT_ALLOWED
from app.core.exception_handlers import error_response

WRITE_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})


class OriginCheckMiddleware:
    def __init__(self, app: ASGIApp, allowed_origins: list[str]) -> None:
        self.app = app
        self.allowed_origins = frozenset(allowed_origins)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["method"] not in WRITE_METHODS:
            await self.app(scope, receive, send)
            return
        headers = Headers(scope=scope)
        origin = headers.get("origin")
        if origin is None or self._is_allowed(origin, headers.get("host")):
            await self.app(scope, receive, send)
            return
        response = error_response(status.HTTP_403_FORBIDDEN, ORIGIN_NOT_ALLOWED)
        await response(scope, receive, send)

    def _is_allowed(self, origin: str, host: str | None) -> bool:
        # Same origin: the page was served by this app. Compared by host only, because behind
        # Render's proxy the app itself sees plain http while the browser uses https.
        return origin in self.allowed_origins or urlsplit(origin).netloc == host
