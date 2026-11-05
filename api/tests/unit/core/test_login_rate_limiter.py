from datetime import datetime, timedelta

from app.constants.time_constants import APP_TIMEZONE
from app.core.login_rate_limiter import LoginRateLimiter

MAX_FAILURES = 3
WINDOW = timedelta(minutes=15)
KEY = "hr@acme.com|203.0.113.7"
OTHER_KEY = "hr@acme.com|198.51.100.4"


class FakeClock:
    def __init__(self) -> None:
        self.now = datetime(2026, 11, 5, 10, 0, tzinfo=APP_TIMEZONE)

    def __call__(self) -> datetime:
        return self.now

    def advance(self, delta: timedelta) -> None:
        self.now += delta


def limiter_with(clock: FakeClock) -> LoginRateLimiter:
    return LoginRateLimiter(max_failures=MAX_FAILURES, window=WINDOW, clock=clock)


def fail(limiter: LoginRateLimiter, times: int, key: str = KEY) -> None:
    for _ in range(times):
        limiter.record_failure(key)


def test_a_key_is_blocked_only_once_it_reaches_the_maximum_failures() -> None:
    limiter = limiter_with(FakeClock())

    fail(limiter, MAX_FAILURES - 1)
    assert not limiter.is_blocked(KEY)

    fail(limiter, 1)
    assert limiter.is_blocked(KEY)


def test_failures_older_than_the_window_no_longer_count() -> None:
    clock = FakeClock()
    limiter = limiter_with(clock)
    fail(limiter, MAX_FAILURES)

    clock.advance(WINDOW)

    assert not limiter.is_blocked(KEY)


def test_the_window_slides_with_each_failure() -> None:
    clock = FakeClock()
    limiter = limiter_with(clock)
    fail(limiter, MAX_FAILURES - 1)
    clock.advance(WINDOW / 2)
    fail(limiter, 1)

    clock.advance(WINDOW / 2)

    # The first failures have expired; only the last one still counts.
    assert not limiter.is_blocked(KEY)
    fail(limiter, MAX_FAILURES - 2)
    assert not limiter.is_blocked(KEY)


def test_reset_forgets_the_failures_of_a_key() -> None:
    limiter = limiter_with(FakeClock())
    fail(limiter, MAX_FAILURES)

    limiter.reset(KEY)

    assert not limiter.is_blocked(KEY)


def test_keys_are_counted_separately() -> None:
    limiter = limiter_with(FakeClock())

    fail(limiter, MAX_FAILURES)

    assert not limiter.is_blocked(OTHER_KEY)
