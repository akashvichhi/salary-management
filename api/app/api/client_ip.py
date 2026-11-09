from fastapi import Request

from app.constants.auth_constants import UNKNOWN_CLIENT_IP

FORWARDED_FOR_HEADER = "x-forwarded-for"
FORWARDED_FOR_SEPARATOR = ","


def client_ip(request: Request, trust_forwarded_for: bool) -> str:
    """The caller's IP, for the login rate limit (decision 23).

    Behind Render's proxy, the last X-Forwarded-For entry is the address the proxy itself saw.
    Every earlier entry was sent by the caller and can be anything, so trusting it would let each
    login attempt claim a new IP and never reach the limit. Without such a proxy the whole header
    comes from the caller, so it is read only when `trust_forwarded_for` is on.
    """
    forwarded_for = request.headers.get(FORWARDED_FOR_HEADER) if trust_forwarded_for else None
    if forwarded_for:
        last_hop = forwarded_for.rsplit(FORWARDED_FOR_SEPARATOR, 1)[-1].strip()
        if last_hop:
            return last_hop
    return request.client.host if request.client else UNKNOWN_CLIENT_IP
