"""Counts failed logins per key (email and IP) in memory, over a sliding window.

In memory, not in the database (decision 23): the app runs as one process in one container,
so one counter is enough, and a restart forgetting the count is acceptable.
"""

import threading
from collections import defaultdict, deque
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
        self._failures: defaultdict[str, deque[datetime]] = defaultdict(deque)
        # Plain `def` endpoints run in a thread pool, so two logins can arrive at once.
        self._lock = threading.Lock()

    def is_blocked(self, key: str) -> bool:
        with self._lock:
            return len(self._recent_failures(key)) >= self.max_failures

    def record_failure(self, key: str) -> None:
        with self._lock:
            self._recent_failures(key).append(self.clock())

    def reset(self, key: str) -> None:
        with self._lock:
            self._failures.pop(key, None)

    def _recent_failures(self, key: str) -> deque[datetime]:
        failures = self._failures[key]
        oldest_counted = self.clock() - self.window
        while failures and failures[0] <= oldest_counted:
            failures.popleft()
        return failures
