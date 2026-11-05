from fastapi import Request

from app.constants.auth_constants import UNKNOWN_CLIENT_IP


def client_ip(request: Request) -> str:
    """The caller's IP. Behind Render's proxy, uvicorn's --proxy-headers sets it from
    X-Forwarded-For; without it every request would seem to come from the proxy."""
    return request.client.host if request.client else UNKNOWN_CLIENT_IP
