import re

from app.core.security import (
    generate_session_token,
    hash_password,
    hash_session_token,
    verify_password,
)

PASSWORD = "correct horse battery staple"
SHA256_HEX_LENGTH = 64
# token_urlsafe(32) encodes 32 random bytes as 43 URL-safe characters.
MIN_SESSION_TOKEN_LENGTH = 43
URL_SAFE_PATTERN = re.compile(r"^[A-Za-z0-9_-]+$")


def test_a_hashed_password_verifies_and_is_not_the_password() -> None:
    password_hash = hash_password(PASSWORD)

    assert PASSWORD not in password_hash
    assert password_hash.startswith("$argon2id$")
    assert verify_password(password_hash, PASSWORD)


def test_a_wrong_password_does_not_verify() -> None:
    assert not verify_password(hash_password(PASSWORD), "wrong password")


def test_the_same_password_hashes_differently_each_time() -> None:
    assert hash_password(PASSWORD) != hash_password(PASSWORD)


def test_a_malformed_hash_does_not_verify() -> None:
    assert not verify_password("not-a-hash", PASSWORD)


def test_session_tokens_are_long_random_and_url_safe() -> None:
    first, second = generate_session_token(), generate_session_token()

    assert first != second
    assert len(first) >= MIN_SESSION_TOKEN_LENGTH
    assert URL_SAFE_PATTERN.match(first)


def test_a_session_token_hash_is_a_stable_sha256_and_hides_the_token() -> None:
    token = generate_session_token()

    token_hash = hash_session_token(token)

    assert token_hash == hash_session_token(token)
    assert len(token_hash) == SHA256_HEX_LENGTH
    assert token not in token_hash
