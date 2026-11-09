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
        assert limiter.start_attempt(key)


def test_attempts_are_allowed_until_the_maximum_then_refused() -> None:
    limiter = limiter_with(FakeClock())

    fail(limiter, MAX_FAILURES)

    assert not limiter.start_attempt(KEY)


def test_an_attempt_counts_before_its_outcome_is_known() -> None:
    # Logins checked in parallel: none has failed yet, and still only the maximum get through.
    limiter = limiter_with(FakeClock())

    allowed = [limiter.start_attempt(KEY) for _ in range(MAX_FAILURES + 2)]

    assert allowed == [True] * MAX_FAILURES + [False, False]


def test_attempts_older_than_the_window_no_longer_count() -> None:
    clock = FakeClock()
    limiter = limiter_with(clock)
    fail(limiter, MAX_FAILURES)

    clock.advance(WINDOW)

    assert limiter.start_attempt(KEY)


def test_the_window_slides_with_each_attempt() -> None:
    clock = FakeClock()
    limiter = limiter_with(clock)
    fail(limiter, MAX_FAILURES - 1)
    clock.advance(WINDOW / 2)
    fail(limiter, 1)

    clock.advance(WINDOW / 2)

    # The first attempts have expired; only the last one still counts.
    fail(limiter, MAX_FAILURES - 1)
    assert not limiter.start_attempt(KEY)


def test_reset_forgets_the_attempts_of_a_key() -> None:
    limiter = limiter_with(FakeClock())
    fail(limiter, MAX_FAILURES)

    limiter.reset(KEY)

    assert limiter.start_attempt(KEY)
    assert len(limiter) == 1


def test_a_refused_attempt_is_not_counted() -> None:
    clock = FakeClock()
    limiter = limiter_with(clock)
    fail(limiter, MAX_FAILURES)
    clock.advance(WINDOW / 2)
    assert not limiter.start_attempt(KEY)

    clock.advance(WINDOW / 2)

    fail(limiter, MAX_FAILURES)


def test_keys_that_are_never_tried_again_are_forgotten_after_a_window() -> None:
    clock = FakeClock()
    limiter = limiter_with(clock)
    fail(limiter, 1)

    clock.advance(WINDOW)
    fail(limiter, 1, key=OTHER_KEY)

    assert len(limiter) == 1


def test_keys_are_counted_separately() -> None:
    limiter = limiter_with(FakeClock())

    fail(limiter, MAX_FAILURES)

    assert limiter.start_attempt(OTHER_KEY)
