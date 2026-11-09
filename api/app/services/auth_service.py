import secrets
from dataclasses import dataclass
from datetime import timedelta

from sqlalchemy.orm import Session

from app.constants.messages import (
    INVALID_CREDENTIALS,
    NOT_AUTHENTICATED,
    TOO_MANY_LOGIN_ATTEMPTS,
)
from app.core.exceptions import TooManyRequestsError, UnauthenticatedError
from app.core.login_rate_limiter import LoginRateLimiter
from app.core.security import (
    generate_session_token,
    hash_password,
    hash_session_token,
    verify_password,
)
from app.models.base_model import now_in_app_timezone
from app.models.session_model import SessionModel
from app.models.user_model import UserModel
from app.repositories.session_repository import SessionRepository
from app.repositories.user_repository import UserRepository
from app.schemas.requests.login_request import LoginRequest

# Checked when the email is unknown, so a wrong email takes as long as a wrong password
# and response times don't reveal which emails exist.
UNKNOWN_USER_PASSWORD_HASH = hash_password(secrets.token_urlsafe())


@dataclass(frozen=True)
class LoginResult:
    user: UserModel
    # Goes only into the httpOnly cookie, never into a response body or a log.
    session_token: str


class AuthService:
    def __init__(
        self,
        session: Session,
        user_repository: UserRepository,
        session_repository: SessionRepository,
        rate_limiter: LoginRateLimiter,
        session_ttl: timedelta,
    ) -> None:
        self.session = session
        self.user_repository = user_repository
        self.session_repository = session_repository
        self.rate_limiter = rate_limiter
        self.session_ttl = session_ttl

    def login(self, request: LoginRequest, client_ip: str) -> LoginResult:
        # Per email and IP, so guessing one account's password is slowed down without
        # letting someone else lock the HR manager out from their own address.
        rate_limit_key = f"{request.email}|{client_ip}"
        if not self.rate_limiter.start_attempt(rate_limit_key):
            raise TooManyRequestsError(TOO_MANY_LOGIN_ATTEMPTS)
        user = self.user_repository.find_by_email(request.email)
        password_hash = user.password_hash if user else UNKNOWN_USER_PASSWORD_HASH
        password_matches = verify_password(password_hash, request.password.get_secret_value())
        if user is None or not password_matches:
            # The attempt was already counted, so it stays counted as a failure.
            raise UnauthenticatedError(INVALID_CREDENTIALS)
        self.rate_limiter.reset(rate_limit_key)
        return LoginResult(user=user, session_token=self._start_session(user))

    def logout(self, session_token: str | None) -> None:
        """Ends the session. Always succeeds, so logging out twice is harmless."""
        if session_token:
            self.session_repository.delete_by_token_hash(hash_session_token(session_token))
            self.session.commit()

    def current_user(self, session_token: str | None) -> UserModel:
        """The user of a live session. A missing, unknown or expired session is a 401."""
        if not session_token:
            raise UnauthenticatedError(NOT_AUTHENTICATED)
        user_session = self.session_repository.find_by_token_hash(hash_session_token(session_token))
        if user_session is None:
            raise UnauthenticatedError(NOT_AUTHENTICATED)
        if user_session.expires_at <= now_in_app_timezone():
            # Expired sessions are cleaned up when they are used.
            self.session_repository.delete(user_session)
            self.session.commit()
            raise UnauthenticatedError(NOT_AUTHENTICATED)
        return user_session.user

    def _start_session(self, user: UserModel) -> str:
        # Sessions whose cookie is never sent again (another browser, cleared cookies) would
        # otherwise stay forever: they are only deleted when used. Logins are rare, so it's cheap.
        self.session_repository.delete_expired(now_in_app_timezone())
        # A new token on every login, so a session ID set before login is never reused.
        token = generate_session_token()
        self.session_repository.add(
            SessionModel(
                token_hash=hash_session_token(token),
                user_id=user.id,
                expires_at=now_in_app_timezone() + self.session_ttl,
            )
        )
        self.session.commit()
        return token
