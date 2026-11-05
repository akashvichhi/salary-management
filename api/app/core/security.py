"""Password hashing (Argon2) and session tokens. Nothing here is ever logged."""

import hashlib
import secrets

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

SESSION_TOKEN_BYTES = 32

password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return password_hasher.verify(password_hash, password)
    except (VerificationError, InvalidHashError):
        return False


def generate_session_token() -> str:
    return secrets.token_urlsafe(SESSION_TOKEN_BYTES)


def hash_session_token(token: str) -> str:
    # The database keeps only this hash, so a leaked database holds no usable session.
    # A fast hash is enough: the token is 32 random bytes, not a guessable password.
    return hashlib.sha256(token.encode()).hexdigest()
