"""Counts login attempts per key (email and IP) in memory, over a sliding window.

In memory, not in the database (decision 23): the app runs as one process in one container,
so one counter is enough, and a restart forgetting the count is acceptable.
"""

import threading
from collections import deque
from collections.abc import Callable
from datetime import datetime, timedelta

from app.models.base_model import now_in_app_timezone


class LoginRateLimiter:
    def __init__(
        self,
        max_failures: int,
        window: timedelta,
        clock: Callable[[], datetime] = now_in_app_timezone,
    ) -> None:
        self.max_failures = max_failures
        self.window = window
        self.clock = clock
        self._attempts: dict[str, deque[datetime]] = {}
        self._next_sweep = clock() + window
        # Plain `def` endpoints run in a thread pool, so two logins can arrive at once.
        self._lock = threading.Lock()

    def __len__(self) -> int:
        """How many keys are tracked."""
        with self._lock:
            return len(self._attempts)

    def start_attempt(self, key: str) -> bool:
        """Counts an attempt before its password is checked; False if the key is at the limit.

        Counting up front, in one locked step, means logins checked in parallel can't all pass
        before any of them is counted. A successful login then clears the count with `reset`.
        """
        with self._lock:
            self._sweep_expired_keys()
            attempts = self._recent_attempts(key)
            if len(attempts) >= self.max_failures:
                return False
            attempts.append(self.clock())
            self._attempts[key] = attempts
            return True

    def reset(self, key: str) -> None:
        with self._lock:
            self._attempts.pop(key, None)

    def _recent_attempts(self, key: str) -> deque[datetime]:
        attempts = self._attempts.pop(key, deque())
        oldest_counted = self.clock() - self.window
        while attempts and attempts[0] <= oldest_counted:
            attempts.popleft()
        if attempts:
            self._attempts[key] = attempts
        return attempts

    def _sweep_expired_keys(self) -> None:
        # At most once per window, so keys that are never tried again (every email and IP an
        # attacker sprays) don't stay in memory until the next restart.
        if self.clock() < self._next_sweep:
            return
        for key in list(self._attempts):
            self._recent_attempts(key)
        self._next_sweep = self.clock() + self.window
