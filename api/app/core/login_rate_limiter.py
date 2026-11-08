"""Counts failed logins per key (email and IP) in memory, over a sliding window.

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
        self._failures: dict[str, deque[datetime]] = {}
        # Plain `def` endpoints run in a thread pool, so two logins can arrive at once.
        self._lock = threading.Lock()

    def __len__(self) -> int:
        """How many keys have failures still in the window."""
        with self._lock:
            return len(self._failures)

    def is_blocked(self, key: str) -> bool:
        with self._lock:
            return self._recent_failure_count(key) >= self.max_failures

    def record_failure(self, key: str) -> None:
        with self._lock:
            self._recent_failure_count(key)
            self._failures.setdefault(key, deque()).append(self.clock())

    def reset(self, key: str) -> None:
        with self._lock:
            self._failures.pop(key, None)

    def _recent_failure_count(self, key: str) -> int:
        # A key whose failures have all expired is dropped, so every email and IP ever tried
        # doesn't stay in memory until the next restart.
        failures = self._failures.get(key)
        if failures is None:
            return 0
        oldest_counted = self.clock() - self.window
        while failures and failures[0] <= oldest_counted:
            failures.popleft()
        if not failures:
            del self._failures[key]
        return len(failures)
